import {Button, Box, Text, Center } from "@chakra-ui/react"
import {ethers} from 'ethers';
export default function ConnectWalletButton () {

    async function connectWallet() {
        const provider = new ethers.providers.Web3Provider(window.ethereum, "rinkeby");
        // Check if MetaMask installed
        if (window.ethereum) {
            // check if correct network connected
            const chainId = await window.ethereum.request({ method: 'eth_chainId'});

            console.log(chainId)
            if ( chainId != "0x4") {
                alert("Please change to Rinkeby/")
            }
            else {
                
                await provider.send("eth_requestAccounts", []);
                const signer = provider.getSigner();
                console.log("Account:", await signer.getAddress());
                const balance = await provider.getBalance(signer.getAddress());
                console.log("Balance: ", balance);
            }
        }
        else{
            alert("No wallet detected, please install metamask.")
        }
    }
    return (<Center>
        <Button mt={4} colorScheme='teal' type='submit' className="connectButton" onClick={connectWallet} >
        Connect Wallet
        </Button>
        </Center>
    )
}