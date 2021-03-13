"use strict";
window.onload = async () => {
    let mtContractReader;
    let mtContractSigner;
    let userAddress;
    let step = 1;
    let tokenInfoList = [];
    let selectedChain = "0";
    const contractAddress = "0xb1645DB7d8ba837b7eFcE0C41Ca53eC2123AFd5b";
    await window.ethereum.enable();
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const signer = provider.getSigner();
    let data = await getJSON("../ABI/ERC20.json");
    const erc20ABI = data;
    data = await getJSON("../ABI/movingTruck.json");
    const contractABI = data.abi;
    mtContractReader = new ethers.Contract(contractAddress, contractABI, provider);
    mtContractSigner = mtContractReader.connect(signer);
    userAddress = await signer.getAddress();
    let txtAddress = `Your current address is ${userAddress}, it´s correct?. Check it on <a target="_blank" href="https://etherscan.io/address/${userAddress}">Etherscan</a>`;
    document.getElementById("lblSender").innerHTML = txtAddress;
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
                resolve({
                    "name": name,
                    "symbol": symbol,
                    "address": tokenContractAddress
                });
            }
            catch (error) {
                reject(`An error ocurred while trying to fetch the token: ${error}`);
            }
        });
    }
    function getBalanceAndApprovals(tokenContractAddress) {
        return new Promise(async (resolve, reject) => {
            let tokenContract = new ethers.Contract(tokenContractAddress, erc20ABI, provider);
            try {
                let balance = await tokenContract.balanceOf(userAddress);
                balance = ethers.utils.formatUnits(balance, 18);
                let amountApproved = await tokenContract.allowance(userAddress, contractAddress);
                amountApproved = ethers.utils.formatUnits(amountApproved, 18);
                resolve({
                    "amountApproved": amountApproved,
                    "balance": balance,
                });
            }
            catch (error) {
                console.log(error);
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
    function selectTokensChanged(symbol, address) {
        getBalanceAndApprovals(address)
            .then((token) => {
            var _a;
            let balance = Number(token.balance);
            console.log('app', String(Number.MAX_SAFE_INTEGER), token.amountApproved);
            let approved = (token.amountApproved == String(Number.MAX_SAFE_INTEGER) + '.0') ? -1 : Number(token.amountApproved);
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
            (_a = document.getElementById("listTokens")) === null || _a === void 0 ? void 0 : _a.appendChild(li);
        })
            .catch(err => console.log(err));
    }
    function nextStep() {
        var _a, _b, _c, _d, _e, _f;
        switch (step) {
            case 1:
                listAvailableTokens();
                document.getElementById("divOne").style.display = 'none';
                document.getElementById("divTwo").style.display = 'flex';
                document.getElementById("liTwo").classList.add("active");
                (_a = document.getElementById("selectTokens")) === null || _a === void 0 ? void 0 : _a.addEventListener('change', (e) => {
                    var _a, _b, _c;
                    let event = e.target;
                    if (((_a = event.selectedOptions[0]) === null || _a === void 0 ? void 0 : _a.value) !== "none-") {
                        let symbol = (_b = event.selectedOptions[0]) === null || _b === void 0 ? void 0 : _b.innerText;
                        let address = (_c = event.selectedOptions[0]) === null || _c === void 0 ? void 0 : _c.value;
                        selectTokensChanged(symbol, address);
                    }
                });
                (_b = document.getElementById("inputToken")) === null || _b === void 0 ? void 0 : _b.addEventListener('input', (e) => {
                    let event = e.target;
                    let contractAddress = event.value;
                    if (!/^(0x){1}[0-9a-fA-F]{40}$/i.test(contractAddress) && contractAddress.length !== 0) {
                        alert('Please, paste a valid contract address');
                    }
                    else {
                        if (contractAddress !== '') {
                            verifyToken(contractAddress)
                                .then((token) => {
                                selectTokensChanged(token.symbol, token.address);
                                let inputToken = document.getElementById("inputToken");
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
                let tokenList = (_c = document.getElementById("listTokens")) === null || _c === void 0 ? void 0 : _c.childNodes;
                tokenInfoList = [];
                for (let i = 0; i < tokenList.length; i++) {
                    const element = tokenList[i];
                    tokenInfoList.push({
                        "symbol": element.firstElementChild.attributes.symbol.value,
                        "address": element.firstElementChild.attributes.address.value,
                        "balance": element.firstElementChild.attributes.balance.value,
                        "approved": element.firstElementChild.attributes.approved.value,
                        "value": element.firstElementChild.value
                    });
                }
                for (let e = 0; e < tokenInfoList.length; e++) {
                    const element = tokenInfoList[e];
                    console.log('list: ', element);
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
                        (_d = document.getElementById("listTokensForApprove")) === null || _d === void 0 ? void 0 : _d.appendChild(li);
                    }
                }
                break;
            case 3:
                document.getElementById("divThree").style.display = 'none';
                document.getElementById("divFour").style.display = 'flex';
                document.getElementById("liFour").classList.add("active");
                let inputEth = document.getElementById("inputEth");
                let ethValue = inputEth.value;
                if (ethValue > 0) {
                    let li = document.createElement("li");
                    li.innerText = `${ethValue} in ETH`;
                    (_e = document.getElementById("resumeList")) === null || _e === void 0 ? void 0 : _e.appendChild(li);
                }
                for (let e = 0; e < tokenInfoList.length; e++) {
                    const element = tokenInfoList[e];
                    let li = document.createElement("li");
                    li.innerText = `${element.balance} in ${element.symbol}`;
                    (_f = document.getElementById("resumeList")) === null || _f === void 0 ? void 0 : _f.appendChild(li);
                }
                break;
        }
        step += 1;
    }
    async function networkChanged(newNetwork) {
        selectedChain = newNetwork.chainId.toString();
        if (selectedChain == "1" || selectedChain == "56" || selectedChain == "250" || selectedChain == "1337") {
            console.log(selectedChain);
        }
        else {
            selectedChain = "0";
            alert('The current network is unsupported, please switch your wallet to a supported one');
        }
    }
    let btnList = document.getElementsByClassName("btnNext");
    for (let i = 0; i < btnList.length; i++) {
        const element = btnList[i];
        element.addEventListener("click", nextStep);
    }
    document.getElementsByClassName("btnMove")[0].addEventListener('click', async () => {
        let inputEth = document.getElementById("inputEth");
        let ethValue = inputEth.value;
        ethValue = (Number(ethValue) > 0) ? ethValue : "0";
        let inputRecipient = document.getElementById("inputRecipient");
        let recipient = inputRecipient.value;
        let inputTip = document.getElementById("inputTip");
        let sendTip = inputTip.checked;
        let tokensArray = [];
        let tokensQuantity = [];
        for (let x = 0; x < tokenInfoList.length; x++) {
            const element = tokenInfoList[x];
            tokensArray.push(element.address);
            tokensQuantity.push(element.value);
        }
        let tx = await moveTokens(ethValue, tokensArray, tokensQuantity, recipient, sendTip);
        console.log('tx', tx);
    });
    provider.on("network", (newNetwork, oldNetwork) => {
        if (oldNetwork) {
            networkChanged(newNetwork);
        }
    });
};
