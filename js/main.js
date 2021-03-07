"use strict";
window.onload = async () => {
    let mtContractReader;
    let mtContractSigner;
    let userAddress;
    let selectedChain = 'ethereum';
    let step = 1;
    const contractAddress = "0xb1645DB7d8ba837b7eFcE0C41Ca53eC2123AFd5b";
    await window.ethereum.enable();
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    let data = await getJSON("../ABI/ERC20Preset.json");
    const erc20ABI = data.abi;
    function getJSON(url) {
        return new Promise((resolve, reject) => {
            fetch(url)
                .then((response) => {
                resolve(response.json());
            })
                .then((data) => reject(data));
        });
    }
    function verifyToken(tokenContractAddress) {
        return new Promise(async (resolve, reject) => {
            let tokenContract = new ethers.Contract(tokenContractAddress, erc20ABI, provider);
            try {
                let name = await tokenContract.name();
                let symbol = await tokenContract.symbol();
                let balance = await tokenContract.balanceOf(userAddress);
                balance = ethers.utils.formatUnits(balance, 18);
                let amountApproved = await tokenContract.allowance(userAddress, contractAddress);
                amountApproved = ethers.utils.formatUnits(amountApproved, 18);
                resolve({
                    "amountApproved": amountApproved,
                    "name": name,
                    "symbol": symbol,
                    "balance": balance
                });
            }
            catch (error) {
                reject(`An error ocurred while trying to fetch the token: ${error}`);
            }
        });
    }
    async function approveToken(tokenContractAddress) {
        let tokenContract = new ethers.Contract(tokenContractAddress, erc20ABI, provider);
        let tokenContractSigner = tokenContract.connect(signer);
        let tx = await tokenContractSigner.approve(contractAddress, ethers.utils.parseUnits(String(Number.MAX_SAFE_INTEGER), "ether"));
        console.log('tx', tx);
    }
    async function moveTokens(ethValue, tokensArray, quantityArray, recipient, sendTip) {
        if (tokensArray.length != quantityArray.length) {
            throw "Arrays don´t match";
        }
        quantityArray = quantityArray.map((num) => {
            let numParsed = ethers.utils.parseUnits(num, 18);
            return numParsed;
        });
        let cnt = 20 - tokensArray.length;
        for (let i = 0; i < cnt; i++) {
            tokensArray.push("0x0000000000000000000000000000000000000000");
            quantityArray.push(0);
        }
        ethValue = !ethValue || ethValue == undefined ? "0" : ethValue;
        let overrides = {
            value: ethers.utils.parseEther(ethValue),
        };
        let tx = await mtContractSigner.move(tokensArray, quantityArray, recipient, sendTip, overrides);
        console.log('tx', tx);
    }
    function test() {
        let arr = ["0x5164a7fEC539B2E54D2A2Cfb9324483F6F42DdbE", "0x14A7E77FbFC96e90F8A5Cbec53De86797aa67695"];
        approveToken(arr[0]);
        approveToken(arr[1]);
        arr.forEach(element => {
            verifyToken(element);
        });
        let numArray = ['10', '12.5'];
        moveTokens(0.08, [arr[0], arr[1]], numArray, "0x9EC19f9bed85e6d50AE77Ff7632fEBF04c2B5305", true);
    }
    function listAvailableTokens() {
        getJSON("../data/contractAddresses.json")
            .then((data) => {
            var _a;
            let tokensList = data[selectedChain].tokens;
            for (let tokenName in tokensList) {
                let optionToInsert = document.createElement('option');
                optionToInsert.value = tokensList[tokenName];
                optionToInsert.text = tokenName.toUpperCase();
                (_a = document.getElementById("selectTokens")) === null || _a === void 0 ? void 0 : _a.appendChild(optionToInsert);
            }
        })
            .catch(err => console.log(err));
    }
    function selectTokensChanged(text) {
        var _a;
        let input = document.createElement('input');
        input.placeholder = 'Token quantity';
        input.type = 'text';
        let li = document.createElement("li");
        li.innerText = `${text}: `;
        li.appendChild(input);
        (_a = document.getElementById("listTokens")) === null || _a === void 0 ? void 0 : _a.appendChild(li);
    }
    function nextStep() {
        var _a, _b;
        switch (step) {
            case 1:
                listAvailableTokens();
                document.getElementById("divOne").style.display = 'none';
                document.getElementById("divTwo").style.display = 'flex';
                document.getElementById("liTwo").classList.add("active");
                (_a = document.getElementById("selectTokens")) === null || _a === void 0 ? void 0 : _a.addEventListener('change', (e) => {
                    var _a, _b;
                    let text = (_b = (_a = e.target) === null || _a === void 0 ? void 0 : _a.selectedOptions[0]) === null || _b === void 0 ? void 0 : _b.innerText;
                    selectTokensChanged(text);
                });
                (_b = document.getElementById("inputToken")) === null || _b === void 0 ? void 0 : _b.addEventListener('input', (e) => {
                    var _a;
                    let contractAddress = (_a = e.target) === null || _a === void 0 ? void 0 : _a.value;
                    if (!/^(0x){1}[0-9a-fA-F]{40}$/i.test(contractAddress) && contractAddress.length !== 0) {
                        alert('Please, paste a valid contract address');
                    }
                    else {
                        if (contractAddress !== '') {
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
        step += 1;
    }
    data = await getJSON("../ABI/movingTruck.json");
    const contractABI = data.abi;
    mtContractReader = new ethers.Contract(contractAddress, contractABI, provider);
    mtContractSigner = mtContractReader.connect(signer);
    userAddress = await signer.getAddress();
    let txtAddress = `Your current address is ${userAddress}, it´s correct?. Check it on <a target="_blank" href="https://etherscan.io/address/${userAddress}">Etherscan</a>`;
    document.getElementById("lblSender").innerHTML = txtAddress;
    let btnList = document.getElementsByClassName("btnNext");
    for (let i = 0; i < btnList.length; i++) {
        const element = btnList[i];
        element.addEventListener("click", nextStep);
    }
};
