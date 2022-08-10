import { ChakraProvider, Container, HStack, Spinner, Stack, Text, Button } from "@chakra-ui/react"
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
import theme from "../styles"
import GroupStep from "./components/GroupStep"
import IdentityStep from "./components/IdentityStep"
import ProofStep from "./components/ProofStep"

function App() {
    const [_logs, setLogs] = useState<string>("")
    const [_step, setStep] = useState<number>(1)
    const [_identity, setIdentity] = useState<Identity>()
    const [_signer, setSigner] = useState<Signer>()
    const [_contract, setContract] = useState<Contract>()
    const [currentAccount, setCurrentAccount] = useState<string>()
    const [_event, setEvent] = useState<any>()
    
    const contractAddress = '0x1D68aE7BA2782F7ffF506F3aa382d0c6581643D0'

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
                console.log('accounts', accounts[0])
                setCurrentAccount(accounts[0])
            }

            ethereum.on("accountsChanged", (newAccounts: string[]) => {
                if (newAccounts.length !== 0) {
                    setSigner(ethersProvider.getSigner())
                    setContract(new Contract(contractAddress!, Events.abi, ethersProvider.getSigner()))
                } else {
                    setSigner(undefined)
                }
            })
        })()
    }, [])

    const connectWallet = async () => {
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
      }

    return (
        <>
            <Container maxW="lg" flex="1" display="flex" alignItems="center" centerContent>
                {!currentAccount && <Button mt={5} onClick={connectWallet} colorScheme='blue'>Connect</Button>}
                {currentAccount && (<Stack mt={5}>
                    {_step === 1 ? (
                        <IdentityStep onChange={setIdentity} onLog={setLogs} onNextClick={() => setStep(2)} />
                    ) : _step === 3 ? (
                        <GroupStep
                            signer={_signer}
                            contract={_contract}
                            identity={_identity as Identity}
                            onPrevClick={() => setStep(1)}
                            onSelect={(event) => {
                                setEvent(event)
                                setStep(3)
                            }}
                            onLog={setLogs}
                        />
                    ) : (
                        <ProofStep
                            currentAccount={currentAccount}
                            signer={_signer}
                            contract={_contract}
                            identity={_identity as Identity}
                            event={_event}
                            onPrevClick={() => setStep(2)}
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
