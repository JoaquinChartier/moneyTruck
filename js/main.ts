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

    function getJSON(url:string) {
        //Get JSON ABI
        return new Promise((resolve, reject) => {
            fetch(url)
                .then((response) => {
                    resolve(response.json());
                })
                .then((data) => reject(data));
        });
    }

    async function verifyToken(tokenContractAddress:string) {
        //Check available balance on specified token and approvals
        let tokenContract = new ethers.Contract(
            tokenContractAddress,
            erc20ABI,
            provider
        );
        let name = await tokenContract.name();
        let symbol = await tokenContract.symbol();
        let balance = await tokenContract.balanceOf(userAddress);
        balance = ethers.utils.formatUnits(balance, 18);
        let amountApproved = await tokenContract.allowance(userAddress, contractAddress);
        amountApproved = ethers.utils.formatUnits(amountApproved, 18) //cast decimals
        console.log(amountApproved, name, symbol, balance);
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

    async function moveTokens(ethValue:number,tokensArray:string[],quantityArray:any[],recipient:string,sendTip:boolean) {
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

        ethValue = !ethValue || ethValue == undefined ? 0 : ethValue;
        //Overrides ether value to send
        let overrides = {
            // To convert Ether to Wei:
            value: ethers.utils.parseEther(ethValue.toString()),
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

    function nextStep(){
        switch (step){
            case 1:
                document.getElementById("divOne").style.display = 'none';
                document.getElementById("divTwo").style.display = 'block';
                document.getElementById("liTwo").classList.add("active");
                break;
            case 2:
                document.getElementById("divTwo").style.display = 'none';
                document.getElementById("divThree").style.display = 'block';
                document.getElementById("liThree").classList.add("active");
                break;
            case 3:
                document.getElementById("divThree").style.display = 'none';
                document.getElementById("divFour").style.display = 'block';
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