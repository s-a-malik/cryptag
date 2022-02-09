import {Button, Box, Text, Center } from "@chakra-ui/react"
import {ethers} from 'ethers';
import { useState, useContext } from "react";
import { getAddress } from "../lib/metamask";
import { UserContext } from "../lib/UserContext";

export default function ConnectWalletButton ({ onClick }) {
    const { user, setUser } = useContext(UserContext);

    return (<Center>
        <Button colorScheme='teal' type='submit' className="connectButton" onClick={async () => await getAddress()} >
            {user.address? 'Wallet Connected': 'Connect Wallet'}
        </Button>
        </Center>
    )
}