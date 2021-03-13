window.onload = async () => {
    let mtContractReader:any; //Can Read
    let mtContractSigner:any; //Can Sign
    let userAddress:any; //Metamask user address
    let step:number = 1;
    let tokenInfoList:any[] = [];
    let selectedChain:string = "0";
    const contractAddress = "0xb1645DB7d8ba837b7eFcE0C41Ca53eC2123AFd5b"; //MovingTruck contract address
    //Open metamask and load
    await window.ethereum.enable();
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const signer = provider.getSigner();
    //Load ERC20 ABI
    let data:any = await getJSON("../ABI/ERC20.json");
    const erc20ABI = data;
    //Load movingTruck contract
    data = await getJSON("../ABI/movingTruck.json");
    const contractABI = data.abi;
    mtContractReader = new ethers.Contract(
        //This obj can read
        contractAddress,
        contractABI,
        provider
    );
    mtContractSigner = mtContractReader.connect(signer); //Can sign
    userAddress = await signer.getAddress(); //User address
        
    let txtAddress = `Your current address is ${userAddress}, it´s correct?. Check it on <a target="_blank" href="https://etherscan.io/address/${userAddress}">Etherscan</a>`;
    document.getElementById("lblSender").innerHTML = txtAddress;

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
                //If it´s not a ERC20, will throw an error
                let name = await tokenContract.name();
                let symbol = await tokenContract.symbol();
                // let balance = await tokenContract.balanceOf(userAddress);
                // balance = ethers.utils.formatUnits(balance, 18);
                // let amountApproved = await tokenContract.allowance(userAddress, contractAddress);
                // amountApproved = ethers.utils.formatUnits(amountApproved, 18) //cast decimals
                resolve({
                    // "amountApproved": amountApproved,
                    "name": name,
                    "symbol": symbol, 
                    // "balance": balance,
                    "address": tokenContractAddress
                });
            } catch (error) {
                reject(`An error ocurred while trying to fetch the token: ${error}`);
            }
        });
    }

    function getBalanceAndApprovals(tokenContractAddress:string) : Promise<any>{
        //get balance and approvals
        return new Promise(async (resolve, reject) => {
            let tokenContract = new ethers.Contract(
                tokenContractAddress,
                erc20ABI,
                provider
            );
            try {
                //If it´s not a ERC20, will throw an error
                let balance = await tokenContract.balanceOf(userAddress);
                balance = ethers.utils.formatUnits(balance, 18);
                let amountApproved = await tokenContract.allowance(userAddress, contractAddress);
                amountApproved = ethers.utils.formatUnits(amountApproved, 18) //cast decimals
                resolve({
                    "amountApproved": amountApproved,
                    "balance": balance,
                });
            } catch (error) {
                console.log(error);
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
        // let arr = ["0x5164a7fEC539B2E54D2A2Cfb9324483F6F42DdbE", "0x14A7E77FbFC96e90F8A5Cbec53De86797aa67695"];
        // approveToken(arr[0]);
        // approveToken(arr[1]);
        // arr.forEach(element => {
        //     verifyToken(element);
        // });
        // let numArray = ['10', '12.5'];
        // moveTokens(0.08, [arr[0], arr[1]], numArray, "0x9EC19f9bed85e6d50AE77Ff7632fEBF04c2B5305",true);
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

    function selectTokensChanged(symbol:string, address:string){
        getBalanceAndApprovals(address)
        .then((token) => {
            let balance:number = Number(token.balance);
            console.log('app', String(Number.MAX_SAFE_INTEGER), token.amountApproved)
            let approved:number = (token.amountApproved == String(Number.MAX_SAFE_INTEGER)+'.0') ? -1 : Number(token.amountApproved); ///!!!!!
            //When selector is changed
            let input = document.createElement('input');
            input.placeholder = 'Token quantity';
            input.type = 'text';
            input.setAttribute('address', address);
            input.setAttribute('symbol', symbol);
            input.setAttribute('balance', balance.toString());
            input.setAttribute('approved', approved.toString());
            let li = document.createElement("li");
            li.innerText = `${symbol} - balance: ${balance} ->`;
            li.appendChild(input);
            document.getElementById("listTokens")?.appendChild(li);
        })
        .catch(err => console.log(err));
    }

    function nextStep(){
        switch (step){
            case 1:
                listAvailableTokens();
                document.getElementById("divOne").style.display = 'none';
                document.getElementById("divTwo").style.display = 'flex';
                document.getElementById("liTwo").classList.add("active");
                document.getElementById("selectTokens")?.addEventListener('change', (e) => {
                    let event:any = e.target;
                    if (event.selectedOptions[0]?.value !== "none-"){
                        let symbol = event.selectedOptions[0]?.innerText;
                        let address = event.selectedOptions[0]?.value;
                        selectTokensChanged(symbol, address);
                    }
                });
                document.getElementById("inputToken")?.addEventListener('input', (e) => {
                    let event:any = e.target;
                    let contractAddress = event.value;
                    if (!/^(0x){1}[0-9a-fA-F]{40}$/i.test(contractAddress) && contractAddress.length !== 0) {
                        alert('Please, paste a valid contract address');
                    }else{
                        if (contractAddress !== ''){
                            verifyToken(contractAddress)
                            .then((token) => {
                                selectTokensChanged(token.symbol, token.address);
                                let inputToken:any = document.getElementById("inputToken");
                                inputToken.value = '';
                            })
                            .catch(err => { 
                                console.log(err);
                                alert('The requested address is not a ERC20 token');
                            });
                        }
                    }
                });
                break;
            case 2:
                document.getElementById("divTwo").style.display = 'none';
                document.getElementById("divThree").style.display = 'flex';
                document.getElementById("liThree").classList.add("active");
                let tokenList:any = document.getElementById("listTokens")?.childNodes;
                tokenInfoList = [];
                for (let i = 0; i < tokenList.length; i++) {
                    const element:any = tokenList[i];
                    tokenInfoList.push({
                        "symbol": element.firstElementChild.attributes.symbol.value,
                        "address":element.firstElementChild.attributes.address.value,
                        "balance":element.firstElementChild.attributes.balance.value,
                        "approved": element.firstElementChild.attributes.approved.value,
                        "value": element.firstElementChild.value
                    });
                }

                for (let e = 0; e < tokenInfoList.length; e++) {
                    const element = tokenInfoList[e];
                    console.log('list: ', element)
                    if (element.approved !== "-1") {
                        let btn = document.createElement('button');
                        btn.type = 'button';
                        btn.textContent = `Approve ${element.symbol}`;
                        btn.addEventListener('click', async () => {
                            await approveToken(element.address);
                        });
                        let li = document.createElement("li");
                        li.innerText = `Balance in ${element.symbol}: ${element.balance} `;
                        li.appendChild(btn);
                        document.getElementById("listTokensForApprove")?.appendChild(li);
                    }
                }
                break;
            case 3:
                document.getElementById("divThree").style.display = 'none';
                document.getElementById("divFour").style.display = 'flex';
                document.getElementById("liFour").classList.add("active");

                let inputEth:any = document.getElementById("inputEth");
                let ethValue = inputEth.value;
                if (ethValue > 0){
                    let li = document.createElement("li");
                    li.innerText = `${ethValue} in ETH`;
                    document.getElementById("resumeList")?.appendChild(li);
                }
                for (let e = 0; e < tokenInfoList.length; e++) {
                    const element = tokenInfoList[e];
                    let li = document.createElement("li");
                    li.innerText = `${element.balance} in ${element.symbol}`;
                    document.getElementById("resumeList")?.appendChild(li);
                }
                break;
        }
        step += 1;
    }

    async function networkChanged(newNetwork:any){
        // let _network:any = await provider.getNetwork();
        selectedChain =  newNetwork.chainId.toString();
        if (selectedChain == "1" || selectedChain == "56" || selectedChain == "250" || selectedChain == "1337") {
            console.log(selectedChain);
        }else{
            selectedChain = "0";
            alert('The current network is unsupported, please switch your wallet to a supported one');
        }
    }
    

    //Listeners
    let btnList = document.getElementsByClassName("btnNext");
    for (let i = 0; i < btnList.length; i++) {
        const element = btnList[i];
        element.addEventListener("click", nextStep);
    }
    document.getElementsByClassName("btnMove")[0].addEventListener('click', async () => {
        let inputEth:any = document.getElementById("inputEth");
        let ethValue:string = inputEth.value;
        ethValue = (Number(ethValue) > 0) ? ethValue: "0";
        let inputRecipient:any = document.getElementById("inputRecipient");
        let recipient:string = inputRecipient.value;
        let inputTip:any = document.getElementById("inputTip");
        let sendTip:boolean = inputTip.checked;
        let tokensArray:string[] = [];
        let tokensQuantity:any[] = [];
        for (let x = 0; x < tokenInfoList.length; x++) {
            const element = tokenInfoList[x];
            tokensArray.push(element.address);
            tokensQuantity.push(element.value);
        }
        let tx = await moveTokens(ethValue,tokensArray, tokensQuantity,recipient, sendTip);
        console.log('tx',tx);
    });
    provider.on("network", (newNetwork:any, oldNetwork:any) => {
        // When a Provider makes its initial connection, it emits a "network"
        // event with a null oldNetwork along with the newNetwork. So, if the
        // oldNetwork exists, it represents a changing network
        if (oldNetwork) {
            //window.location.reload();
            networkChanged(newNetwork);
        }
    });
};