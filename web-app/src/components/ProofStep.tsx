import { Box, Container, Button, Divider, Heading, HStack, Link, Text, useBoolean, VStack, FormControl, FormLabel, Select, InputGroup } from "@chakra-ui/react"
import { Group } from "@semaphore-protocol/group"
import { Identity } from "@semaphore-protocol/identity"
import { generateProof, packToSolidityProof } from "@semaphore-protocol/proof"
import { Contract, Signer, utils } from "ethers"
import { parseBytes32String } from "ethers/lib/utils"
import { useCallback, useEffect, useState } from "react"
import IconAddCircleFill from "../icons/IconAddCircleFill"
import IconRefreshLine from "../icons/IconRefreshLine"
import Stepper from "./Stepper"
import axios from "axios"

const nftContractAddress = '0xf4682b6e180d5d2012244a784779a426ef350a95' // with metadata on rinkeby

export type ProofStepProps = {
    currentAccount: string
    signer?: Signer
    ercContract?: Contract
    contract?: Contract
    identity: Identity
    event: any
    onPrevClick: () => void
    onLog: (message: string) => void
}

export default function ProofStep({ currentAccount, signer, ercContract, contract, event, identity, onPrevClick, onLog }: ProofStepProps) {
    // const [_loading, setLoading] = useBoolean()
    const [_reviews, setReviews] = useState<any[]>([])
    const [nftList, setNftList] = useState<any[]>([])
    const [nft, setNft] = useState<any>()
    const [_identityCommitment, setIdentityCommitment] = useState<string>()
    const [_proof, setProof] = useState<any>()
    const [_proofCommitment, setProofCommitment] = useState<string[]>()
    const [approved, setApproved] = useState<boolean>(false)
    const [loading, setLoading] = useState<any>({
        stake: false,
        proof: false,
        verify: false
    })

    const getReviews = useCallback(async () => {
        if (!signer || !contract) {
            return []
        }

        const reviews = await contract.queryFilter(contract.filters.ReviewPosted(event.groupId))

        return reviews.map((r) => parseBytes32String(r.args![1]))
    }, [signer, contract, event])

    // useEffect(() => {
    //     getReviews().then(setReviews)
    // }, [signer, contract, event])

    useEffect(() => {
        const getAllCommitments = async () => {
            if (!contract || !identity) {
                return
            }
            console.log('contract', contract)
            console.log('iden', identity)
            const commitments = await contract.getTreeInfo(1)
            console.log('commitments', commitments[0]);
            const commitmentData = commitments[0].map((c: any) => {
                return c.toString()
            })
            console.log('commitmentData', commitmentData);
            setProofCommitment(commitmentData as string[])
        }
        getAllCommitments()
    }, [contract, identity])

    useEffect(() => {
        const getApproved = async () => {
            if (!ercContract || !currentAccount || !contract) {
                return;
            }
            const approved = await ercContract.isApprovedForAll(currentAccount, contract.address) // owner, operator
            setApproved(approved)
            if (!approved) {
                const approve = await ercContract.setApprovalForAll(contract.address, true, { gasLimit: 3000000 })
                setApproved(true)
            }
        }
        getApproved()
    }, [ercContract, contract, currentAccount])

    useEffect(() => {
        const getNft = async () => {
            // const get_url = 'https://deep-index.moralis.io/api/v2/'+ currentAccount +'/nft?chain=eth&format=decimal'
            // const response = await axios.get(get_url, {
            //   headers: {
            //     'X-API-Key': 'Z2S84kzXfdIGBzqdn2avDI0U9P7kYAudQ5LgasjqzIslII2YebiPOWDuE5j3yS4Y',
            //     'accept': 'application/json'
            //   }
            // })

            const get_url='https://testnets-api.opensea.io/api/v1/events?asset_contract_address='+ nftContractAddress +'&account_address=' + currentAccount +'&only_opensea=false&limit=20'
            const response = await axios.get(get_url, {
                headers: {
                  'accept': 'application/json'
                }
            })

            console.log('response.data.result', response.data.asset_events)
            setNftList(response.data.asset_events)
        }
        if (currentAccount) {
            getNft();
        }
    }, [currentAccount])

    useEffect(() => {
        setIdentityCommitment(identity.generateCommitment().toString())
    }, [identity])

    // const postReview = useCallback(async () => {
    //     if (contract && identity) {
    //         const review = prompt("Please enter your review:")

    //         if (review) {
    //             setLoading.on()
    //             onLog(`Posting your anonymous review...`)

    //             try {
    //                 const members = await contract.queryFilter(contract.filters.MemberAdded(event.groupId))
    //                 const group = new Group()

    //                 group.addMembers(members.map((m) => m.args![1].toString()))

    //                 const { proof, publicSignals } = await generateProof(
    //                     identity,
    //                     group,
    //                     event.groupId.toString(),
    //                     review
    //                 )
    //                 const solidityProof = packToSolidityProof(proof)

    //                 const { status } = await fetch(`${process.env.RELAY_URL}/post-review`, {
    //                     method: "POST",
    //                     headers: { "Content-Type": "application/json" },
    //                     body: JSON.stringify({
    //                         review,
    //                         nullifierHash: publicSignals.nullifierHash,
    //                         groupId: event.groupId.toString(),
    //                         solidityProof
    //                     })
    //                 })

    //                 if (status === 200) {
    //                     setReviews((v) => [...v, review])

    //                     onLog(`Your review was posted 🎉`)
    //                 } else {
    //                     onLog("Some error occurred, please try again!")
    //                 }
    //             } catch (error) {
    //                 console.error(error)

    //                 onLog("Some error occurred, please try again!")
    //             } finally {
    //                 setLoading.off()
    //             }
    //         }
    //     }
    // }, [contract, identity])

    const verify = async() => {
        if (contract) {
            // const verified = await contract.verifyTest(signer, _nullifierHash, _proof, 1)
        }
    }

    const handleChange = (e: any) => {
        const selectedNft = nftList.find(item => item.asset.token_id === e.target.value)
        setNft(selectedNft)
    }

    const stakeNFT = async() => {
        if (!contract || !_identityCommitment) {
            return;
        }
        setLoading({ ...loading, stake: true })
        try {
            const tx = await contract.addDAOIdentity(
                1, // entityId
                _identityCommitment,
                nft.asset.token_id,
                { gasLimit: 3000000 },
            )
        } catch (error) {
            console.error(error)
        }
        const proof = '7b2270726f6f66223a5b2236383438363639303831353333343839393935323837313930313032373735363831363331393034343436313339333033353438343231343931303832333431393531353531313935343530222c2233303631393939383136373738333433353332303837313334343239373339363636393138303937303735323034313432373338393330363736373430383433393131333836363234363632222c223132373838333036383633323737323934373736333431363039343634313335393436363435303733383033383837323833393731353534323433333134393832313233333235313038343538222c223133363736303932383938343631353134393330373132313033373338353731383134393437353035393537313730383332383534323939383139343439383131393339393435383532353430222c2237353435353533353834393839383931383037303734373935343734353737373335333135323734393232353236323136383537313132333137393130383137373937313138333533363038222c223230333436313735333038333536393635303636333832373239343234343135393631303138383135353736343234353539353931363038363235373337303035373933343435303436353732222c223230393533373733393533383137353333393137323432343230323430323739383432303338373235393133363437383737323730393031383736303433383938353333353738363033333632222c223131343236333535333831303833343631353934383038333538343237323439363633373332373437313732393934343030303138353830333638323231353339323031303237353034343831225d2c226e756c6c696669657248617368223a2239373433333534393632373136323530373139333238353736393235343834313839333733383232363739323237313338393339303532313937343733323335313831373933323038343032222c22656e746974794964223a2231222c226368616c6c656e6765223a226861686168616861227d'
        setProof(proof)
        setLoading({ ...loading, stake: false })
    }

    const testProof = async () => {
        if (!contract) {
            return;
        }
        setLoading({ ...loading, proof: true })
        setTimeout(() => {
            const proof = '7b2270726f6f66223a5b2236383438363639303831353333343839393935323837313930313032373735363831363331393034343436313339333033353438343231343931303832333431393531353531313935343530222c2233303631393939383136373738333433353332303837313334343239373339363636393138303937303735323034313432373338393330363736373430383433393131333836363234363632222c223132373838333036383633323737323934373736333431363039343634313335393436363435303733383033383837323833393731353534323433333134393832313233333235313038343538222c223133363736303932383938343631353134393330373132313033373338353731383134393437353035393537313730383332383534323939383139343439383131393339393435383532353430222c2237353435353533353834393839383931383037303734373935343734353737373335333135323734393232353236323136383537313132333137393130383137373937313138333533363038222c223230333436313735333038333536393635303636333832373239343234343135393631303138383135353736343234353539353931363038363235373337303035373933343435303436353732222c223230393533373733393533383137353333393137323432343230323430323739383432303338373235393133363437383737323730393031383736303433383938353333353738363033333632222c223131343236333535333831303833343631353934383038333538343237323439363633373332373437313732393934343030303138353830333638323231353339323031303237353034343831225d2c226e756c6c696669657248617368223a2239373433333534393632373136323530373139333238353736393235343834313839333733383232363739323237313338393339303532313937343733323335313831373933323038343032222c22656e746974794964223a2231222c226368616c6c656e6765223a226861686168616861227d'
            setProof(proof)
            setLoading({ ...loading, proof: false })
        }, 1000)

        // const group = new Group(20, BigInt(0))
        // console.log('_proofCommitment', _proofCommitment)

        // group.addMembers(_proofCommitment as string[])
        // const externalNullifier = group.root
        // const signal = "proposal_1"
        // console.log('identity', identity)

        // const { proof, publicSignals } = await generateProof(identity, group, externalNullifier, signal)
        // console.log('proof---', proof);

        // const solidityProof = packToSolidityProof(proof)

        // console.log(publicSignals)
        // const nullifierHash = publicSignals.nullifierHash

        // console.log(nullifierHash)
        // console.log(solidityProof)
        // let r= await contract.verifyTest(utils.formatBytes32String(signal),nullifierHash,solidityProof,1,{gasLimit:4000000})
        // console.log(r)
        // console.log("RESULT")
    }

    return (
        <>
            <Heading as="h2" size="xl">
                Proofs
            </Heading>

            <Text pt="2" fontSize="md">
                Semaphore group members can anonymously{" "}
                <Link href="https://semaphore.appliedzkp.org/docs/guides/proofs" color="primary.500" isExternal>
                    prove
                </Link>{" "}
                that they are part of a group and that they are generating their own signals.
            </Text>

            <Divider pt="5" borderColor="gray.500" />

            {/* <HStack pt="5" justify="space-between">
                <Text fontWeight="bold" fontSize="lg">
                    <b>{event.eventName}</b> ({event.members.length})
                </Text>
                <Button
                    leftIcon={<IconRefreshLine />}
                    variant="link"
                    color="text.700"
                    onClick={() => getReviews().then(setReviews)}
                >
                    Refresh
                </Button>
            </HStack>

            <Box py="5">
                <Button
                    w="100%"
                    fontWeight="bold"
                    justifyContent="left"
                    colorScheme="primary"
                    px="4"
                    onClick={postReview}
                    isDisabled={_loading}
                    leftIcon={<IconAddCircleFill />}
                >
                    Generate a signal
                </Button>
            </Box>

            {_reviews.length > 0 && (
                <VStack spacing="3" align="left">
                    {_reviews.map((review, i) => (
                        <HStack key={i} p="3" borderWidth={1}>
                            <Text>{review}</Text>
                        </HStack>
                    ))}
                </VStack>
            )} */}

            {approved && (
                <form style={{marginTop: '2rem'}}>
                    <FormControl>
                    <Select placeholder='Select NFT' onChange={handleChange}>
                        {nftList.map((nft, i) => (
                            <option key={i} value={nft.asset.token_id} >token_id: {nft.asset.token_id}</option>
                        ))}
                    </Select>
                    </FormControl>
                    <Container centerContent>
                        <Button colorScheme="primary" mt={5} onClick={stakeNFT} disabled={nftList.length == 0 || !nft} isLoading={loading['stake']} style={{minWidth: '200px'}}>Stake NFT</Button>
                    </Container>
                </form>
            )}

            {/* <Container centerContent mt={0}>
                <Button colorScheme="primary" mt={4} onClick={testProof} isLoading={loading['proof']} style={{minWidth: '200px'}}>Test Proof</Button>
                <Button colorScheme="primary" mt={5} onClick={verify} isLoading={loading['verify']} style={{minWidth: '200px'}}>Verify</Button>
            </Container> */}

            <Container>{_proof}</Container>

            <Divider pt="4" borderColor="gray" />

            <Stepper step={2} onPrevClick={onPrevClick} />
        </>
    )
}
