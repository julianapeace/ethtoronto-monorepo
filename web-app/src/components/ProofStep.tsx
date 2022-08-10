import { Box, Button, Divider, Heading, HStack, Link, Text, useBoolean, VStack, FormControl, FormLabel, Select, InputGroup } from "@chakra-ui/react"
import { Group } from "@semaphore-protocol/group"
import { Identity } from "@semaphore-protocol/identity"
import { generateProof, packToSolidityProof } from "@semaphore-protocol/proof"
import { Contract, Signer,utils } from "ethers"
import { parseBytes32String } from "ethers/lib/utils"
import { useCallback, useEffect, useState } from "react"
import IconAddCircleFill from "../icons/IconAddCircleFill"
import IconRefreshLine from "../icons/IconRefreshLine"
import Stepper from "./Stepper"
import axios from "axios"
import { render } from "react-dom"

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
    const [_loading, setLoading] = useBoolean()
    const [balance, setBalance] = useState<string>(0)
    const [_reviews, setReviews] = useState<any[]>([])
    const [nftList, setNftList] = useState<any[]>([])
    const [nft, setNft] = useState<any>()
    const [_identityCommitment, setIdentityCommitment] = useState<string>()
    const [_proof, setProof] = useState<any>()
    const [_proofCommitment, setProofCommitment] = useState<string[]>()
    const [hasStaked,setStaked] = useState<any>()

    const [displayProof,setDisplay]= useState<string>()
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
            commitmentData.forEach((item:any)=>{
                console.log(item)
                console.log(item ===_identityCommitment)
                if(item ===_identityCommitment) {
                    setStaked(true);
                }
            })
            console.log('commitmentData', commitmentData);
            setProofCommitment(commitmentData as string[])
        }
        getAllCommitments()
    }, [contract, identity,hasStaked])

    useEffect(() => {
        const getApproved = async () => {
            if (!ercContract || !currentAccount || !contract) {
                console.log("NO contract returning")
                return;
            }
            const balance:number =await ercContract.balanceOf(currentAccount,1)
            console.log(balance,"the balance")
            if(balance>0){
                setBalance(balance.toString())
                const approved = await ercContract.isApprovedForAll(currentAccount, contract.address) // owner, operator
                console.log('approved---', approved);
                if (!approved) {
                    const approve = await ercContract.setApprovalForAll(contract.address, true, { gasLimit: 3000000 })
                    console.log('approve---', approve);
                }
            }else{
                console.log('user has no nfts')
            }
        }
        getApproved()
    }, [ercContract, contract, currentAccount,hasStaked])

    useEffect(() => {
        const getProof = async () => {
            const group = new Group(20, BigInt(0))
            console.log('_proofCommitment', _proofCommitment)
            group.addMembers(_proofCommitment as string[])
            const externalNullifier = group.root
            const signal = "proposal_1"
            console.log('identity', identity)
            const { proof, publicSignals } = await generateProof(identity, group, externalNullifier, signal)
            console.log('proof---', proof);
            // setProof(proof)
        }
        if (identity && _proofCommitment) {
            //getProof()
        }
    }, [identity, _proofCommitment])

  

    useEffect(() => {
        setIdentityCommitment(identity.generateCommitment().toString())
    }, [identity])

    const postReview = useCallback(async () => {
        if (contract && identity) {
            const review = prompt("Please enter your review:")

            if (review) {
                setLoading.on()
                onLog(`Posting your anonymous review...`)

                try {
                    const members = await contract.queryFilter(contract.filters.MemberAdded(event.groupId))
                    const group = new Group()

                    group.addMembers(members.map((m) => m.args![1].toString()))

                    const { proof, publicSignals } = await generateProof(
                        identity,
                        group,
                        event.groupId.toString(),
                        review
                    )
                    const solidityProof = packToSolidityProof(proof)

                    const { status } = await fetch(`${process.env.RELAY_URL}/post-review`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            review,
                            nullifierHash: publicSignals.nullifierHash,
                            groupId: event.groupId.toString(),
                            solidityProof
                        })
                    })

                    if (status === 200) {
                        setReviews((v) => [...v, review])

                        onLog(`Your review was posted 🎉`)
                    } else {
                        onLog("Some error occurred, please try again!")
                    }
                } catch (error) {
                    console.error(error)

                    onLog("Some error occurred, please try again!")
                } finally {
                    setLoading.off()
                }
            }
        }
    }, [contract, identity])

    const verify = async() => {
        if (contract) {
            // const verified = await contract.verifyTest(signer, _nullifierHash, _proof, 1)
        }
    }

    const handleChange = (e: any) => {
        const selectedNft = nftList.find(item => item.token_id === e.target.value)
        setNft(selectedNft)
    }

    const stakeNFT = async() => {
        console.log('selectedNft', nft)
        if (!contract || !_identityCommitment) {
            return;
        }
        try {
            let tx = await contract.addDAOIdentity(
                1, // entityId
                _identityCommitment,                
                { gasLimit: 3000000 },
            )
            tx=await tx.wait()
            console.log(tx)
            setStaked(true)
        } catch (error) {
            console.error(error)
        }
    }
    const testProof = async () => {
        if (!contract) {
            return;
        }
        const group = new Group(20, BigInt(0))
        console.log('_proofCommitment', _proofCommitment)
        group.addMembers(_proofCommitment as string[])
        const externalNullifier = group.root
        const signal = "proposal_1"
        console.log('identity', identity)
        const { proof, publicSignals } = await generateProof(identity, group, externalNullifier, signal)
        console.log('proof---', proof);
        const solidityProof = packToSolidityProof(proof)
          
            
        console.log(publicSignals)
        const nullifierHash=publicSignals.nullifierHash
     
           
        console.log(nullifierHash)
        console.log(solidityProof)
        let r= await contract.verifyTest(utils.formatBytes32String(signal),nullifierHash,solidityProof,1,{gasLimit:4000000})
        console.log(r)
        console.log("RESULT")
        const params = {
            proof: solidityProof,
            nullifierHash: publicSignals.nullifierHash.toString(),
            entityId: publicSignals.externalNullifier,
            challenge: 'something',
          }
        
          console.log(params)
          const hexified = new (Buffer as any).from(JSON.stringify(params)).toString('hex')
          
          console.log(hexified)
          setDisplay(hexified)
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
                that they are part of a group and that they are generating their own signals. Signals could be anonymous
                votes, leaks, or reviews.
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

            <Button onClick={verify}>Verify</Button>

            <form>
                <FormControl>
                <FormLabel>NFT</FormLabel>
                <FormLabel>Balance:{balance}</FormLabel>
                </FormControl>
                {hasStaked? (
                
                <Button colorScheme="primary" mt={5} onClick={testProof}>Generate Proof</Button>
                
            ) : (
               
                <Button colorScheme="primary" mt={5} onClick={stakeNFT}>Stake NFT</Button>
              

            )}
                
               
            </form>

            <p style={{ wordWrap: "break-word",maxWidth:"1000px"}} >{displayProof}</p>
            <Divider pt="4" borderColor="gray" />

            <Stepper step={3} onPrevClick={onPrevClick} />
        </>
    )
}
