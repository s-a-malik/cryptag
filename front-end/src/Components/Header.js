import {Flex, Box, Spacer, Heading } from "@chakra-ui/react"
import {ethers} from 'ethers';
import ConnectWalletButton from "./ConnectWalletButton";

export default function Header(props) {
    return (
        <Flex align='center'>
            <Box p='2'>
                <Heading size='xl'>{props.title}</Heading>
            </Box>
            <Spacer />
            <Box>
               <ConnectWalletButton />
            </Box>
        </Flex>
    )
}