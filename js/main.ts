window.onload = async () => {
    let mtContractReader:any; //Can Read
    let mtContractSigner:any; //Can Sign
    let userAddress:any; //Metamask address
    let selectedChain:string = 'ethereum';
    let step:number = 1;
    const contractAddress = "0xb1645DB7d8ba837b7eFcE0C41Ca53eC2123AFd5b"; //MovingTruck contract address
    //Open metamask and load
    await window.ethereum.enable();
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    //Load ERC20 ABI
    let data:any = await getJSON("../ABI/ERC20Preset.json");
    const erc20ABI = data.abi;

    function getJSON(url:string) : Promise<any> {
        //Get JSON ABI
        return new Promise((resolve, reject) => {
            fetch(url)
                .then((response) => {
                    resolve(response.json());
                })
                .then((data) => reject(data));
        });
    }

    function verifyToken(tokenContractAddress:string) : Promise<any>{
        //Check available balance on specified token and approvals
        return new Promise(async (resolve, reject) => {
            let tokenContract = new ethers.Contract(
                tokenContractAddress,
                erc20ABI,
                provider
            );
            try {
                let name = await tokenContract.name();
                let symbol = await tokenContract.symbol();
                let balance = await tokenContract.balanceOf(userAddress);
                balance = ethers.utils.formatUnits(balance, 18);
                let amountApproved = await tokenContract.allowance(userAddress, contractAddress);
                amountApproved = ethers.utils.formatUnits(amountApproved, 18) //cast decimals
                //console.log(amountApproved, name, symbol, balance);
                resolve({
                    "amountApproved": amountApproved,
                    "name": name,
                    "symbol": symbol, 
                    "balance": balance
                });
            } catch (error) {
                reject(`An error ocurred while trying to fetch the token: ${error}`);
            }
        });
    }

    async function approveToken(tokenContractAddress:string){
        //Approve token contract to spend funds
        let tokenContract = new ethers.Contract(
            tokenContractAddress,
            erc20ABI,
            provider
        );

        let tokenContractSigner = tokenContract.connect(signer); //Can Sign
        let tx = await tokenContractSigner.approve(contractAddress, ethers.utils.parseUnits(String(Number.MAX_SAFE_INTEGER), "ether")); //Approve max amount
        console.log('tx',tx);
    }

    async function moveTokens(ethValue:string,tokensArray:string[],quantityArray:any[],recipient:string,sendTip:boolean) {
        //Check array validity
        if (tokensArray.length != quantityArray.length) {
            throw "Arrays don´t match";
        }

        //Cast number to wei
        quantityArray = quantityArray.map((num) => {
            //num -> string
            let numParsed = ethers.utils.parseUnits(num,18);
            return numParsed
        });

        //Fill arrays with empty values
        let cnt = 20 - tokensArray.length;
        for (let i = 0; i < cnt; i++) {
            tokensArray.push("0x0000000000000000000000000000000000000000");
            quantityArray.push(0);
        }

        ethValue = !ethValue || ethValue == undefined ? "0" : ethValue;
        //Overrides ether value to send
        let overrides = {
            // To convert Ether to Wei:
            value: ethers.utils.parseEther(ethValue),
        };
        let tx = await mtContractSigner.move(
            tokensArray,
            quantityArray,
            recipient,
            sendTip,
            overrides
        );
        console.log('tx', tx);
    }

    function test(){
        let arr = ["0x5164a7fEC539B2E54D2A2Cfb9324483F6F42DdbE", "0x14A7E77FbFC96e90F8A5Cbec53De86797aa67695"];
        approveToken(arr[0]);
        approveToken(arr[1]);
        arr.forEach(element => {
            verifyToken(element);
        });
        let numArray = ['10', '12.5'];
        moveTokens(0.08, [arr[0], arr[1]], numArray, "0x9EC19f9bed85e6d50AE77Ff7632fEBF04c2B5305",true);
    }

    function listAvailableTokens(){
        //List tokens available by network
        getJSON("../data/contractAddresses.json")
        .then((data) => {
            let tokensList = data[selectedChain].tokens;
            for (let tokenName in tokensList) {
                let optionToInsert = document.createElement('option');
                optionToInsert.value = tokensList[tokenName];
                optionToInsert.text = tokenName.toUpperCase();
                document.getElementById("selectTokens")?.appendChild(optionToInsert);
            }
        })
        .catch(err => console.log(err));
    }

    function selectTokensChanged(text:string){
        //When selector is changed
        let input = document.createElement('input');
        input.placeholder = 'Token quantity';
        input.type = 'text';
        let li = document.createElement("li");
        li.innerText = `${text}: `;
        li.appendChild(input);
        document.getElementById("listTokens")?.appendChild(li);
    }

    function nextStep(){
        switch (step){
            case 1:
                listAvailableTokens();
                document.getElementById("divOne").style.display = 'none';
                document.getElementById("divTwo").style.display = 'flex';
                document.getElementById("liTwo").classList.add("active");
                document.getElementById("selectTokens")?.addEventListener('change', (e) => { 
                    //console.log(e.target.selectedOptions[0].innerText);
                    let text = e.target?.selectedOptions[0]?.innerText;
                    selectTokensChanged(text);
                });
                document.getElementById("inputToken")?.addEventListener('input', (e) => {
                    let contractAddress = e.target?.value;
                    // console.log(contractAddress.length);
                    if (!/^(0x){1}[0-9a-fA-F]{40}$/i.test(contractAddress) && contractAddress.length !== 0) {
                        alert('Please, paste a valid contract address');
                    }else{
                        if (contractAddress !== ''){
                            verifyToken(contractAddress)
                            .then((token) => {
                                console.log(token);
                                selectTokensChanged(token.symbol);
                            })
                            .catch(err => console.log(err));
                        }
                    }
                });
                break;
            case 2:
                document.getElementById("divTwo").style.display = 'none';
                document.getElementById("divThree").style.display = 'flex';
                document.getElementById("liThree").classList.add("active");
                break;
            case 3:
                document.getElementById("divThree").style.display = 'none';
                document.getElementById("divFour").style.display = 'flex';
                document.getElementById("liFour").classList.add("active");
                break;
            case 4:
                break;
        }
        step += 1
    }

    data = await getJSON("../ABI/movingTruck.json");
    const contractABI = data.abi;
    //Can read
    mtContractReader = new ethers.Contract(
        contractAddress,
        contractABI,
        provider
    );
    mtContractSigner = mtContractReader.connect(signer); //Can sign
    userAddress = await signer.getAddress(); //User address
    
    let txtAddress = `Your current address is ${userAddress}, it´s correct?. Check it on <a target="_blank" href="https://etherscan.io/address/${userAddress}">Etherscan</a>`;
    document.getElementById("lblSender").innerHTML = txtAddress;

    //Listeners
    let btnList = document.getElementsByClassName("btnNext");
    for (let i = 0; i < btnList.length; i++) {
        const element = btnList[i];
        element.addEventListener("click", nextStep);
    }
};