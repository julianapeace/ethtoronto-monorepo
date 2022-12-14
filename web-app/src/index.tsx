import { Heading, ChakraProvider, Container, HStack, Spinner, Stack, Text, Button, Tooltip } from "@chakra-ui/react"
import "@fontsource/inter/400.css"
import detectEthereumProvider from "@metamask/detect-provider"
import { Identity } from "@semaphore-protocol/identity"
import { Contract, providers, Signer } from "ethers"
import axios from 'axios'
import { hexlify } from "ethers/lib/utils"
import { ZkIdentity } from '@zk-kit/identity'
import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import Events from "./contract/Staking.json"
import ERC721 from "./contract/ERC721-mock-abi.json"
import theme from "../styles"
import GroupStep from "./components/GroupStep"
import IdentityStep from "./components/IdentityStep"
import ProofStep from "./components/ProofStep"
// import { Buttonx } from "./components/Button"
import "./style.css"

function App() {
    const [_logs, setLogs] = useState<string>("")
    const [_step, setStep] = useState<number>(1)
    const [_identity, setIdentity] = useState<Identity>()
    const [_signer, setSigner] = useState<Signer>()
    const [_contract, setContract] = useState<Contract>()
    const [_ercContract, setErcContract] = useState<Contract>()
    const [currentAccount, setCurrentAccount] = useState<string>()
    const [_event, setEvent] = useState<any>()
    const [loading, setLoading] = useState<boolean>(false)

    const contractAddress = '0x6caf636b6e3c09548E02225b0A6Ab2E0Bc2da1C7'
    // const nftContractAddress = '0x7b6e19f2748b2ce25c7b2b2837dd9722d81943aa'
    const nftContractAddress = '0xdba56ad041f0b1a27990cd7f5da0081182708a1d' // with metadata on rinkeby

    useEffect(() => {
        ;(async () => {
            const ethereum = (await detectEthereumProvider()) as any
            const accounts = await ethereum.request({ method: "eth_accounts" })

            // await ethereum.request({
            //     method: "wallet_switchEthereumChain",
            //     params: [
            //         {
            //             chainId: hexlify(Number(process.env.ETHEREUM_CHAIN_ID!)).replace("0x0", "0x")
            //         }
            //     ]
            // })

            const ethersProvider = new providers.Web3Provider(ethereum)

            if (accounts[0]) {
                setSigner(ethersProvider.getSigner())
                setContract(new Contract(contractAddress!, Events.abi, ethersProvider.getSigner()))
                setErcContract(new Contract(nftContractAddress!, ERC721, ethersProvider.getSigner()))
                console.log('accounts', accounts[0])
                setCurrentAccount(accounts[0])
            }

            ethereum.on("accountsChanged", (newAccounts: string[]) => {
                if (newAccounts.length !== 0) {
                    setSigner(ethersProvider.getSigner())
                    setContract(new Contract(contractAddress!, Events.abi, ethersProvider.getSigner()))
                    setErcContract(new Contract(nftContractAddress!, ERC721, ethersProvider.getSigner()))
                } else {
                    setSigner(undefined)
                }
            })
        })()
    }, [])

    const connectWallet = async () => {
        setLoading(true)
        try {
          const ethereum = (await detectEthereumProvider()) as any

          if (!ethereum) {
            alert("Get MetaMask!");
            return;
          }

          const accounts = await ethereum.request({ method: "eth_requestAccounts" });

          console.log("Connected", accounts[0]);
          setCurrentAccount(accounts[0]);
        } catch (error) {
          console.log(error)
        }
        setLoading(false)
      }

    return (
        <>
            <Container flex="1" display="flex" alignItems="center" centerContent mb={5}>
                <header style={{marginBottom: '1rem'}}>
                    <h1>ZK-NFT ???</h1>
                    {currentAccount && <Tooltip placement='right' hasArrow label='Private Trapdoor' bg='gray.500'><p>????  { currentAccount }</p></Tooltip>}
                </header>
                {!currentAccount && <Button mt={5} onClick={connectWallet} colorScheme="primary" isLoading={loading}>Connect Wallet</Button>}
                {currentAccount && (<Stack mt={5}>
                    {_step === 1 ? (
                        <IdentityStep onChange={setIdentity} onLog={setLogs} onNextClick={() => setStep(2)} />
                    ) : (
                        <ProofStep
                            currentAccount={currentAccount}
                            signer={_signer}
                            contract={_contract}
                            ercContract={_ercContract}
                            identity={_identity as Identity}
                            event={_event}
                            onPrevClick={() => setStep(1)}
                            onLog={setLogs}
                        />
                    )}
                </Stack>
                )}
            </Container>

            <HStack
                flexBasis="56px"
                borderTop="1px solid #8f9097"
                backgroundColor="#DAE0FF"
                align="center"
                justify="center"
                spacing="4"
                p="4"
            >
                {_logs.endsWith("...") && <Spinner color="primary.400" />}
                <Text fontWeight="bold">{_logs || `Current step: ${_step}`}</Text>
            </HStack>
        </>
    )
}

const root = createRoot(document.getElementById("app")!)

root.render(
    <ChakraProvider theme={theme}>
        <App />
    </ChakraProvider>
)
