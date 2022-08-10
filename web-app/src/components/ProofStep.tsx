import { Box, Button, Divider, Heading, HStack, Link, Text, useBoolean, VStack, FormControl, FormLabel, Select, InputGroup, useToast } from "@chakra-ui/react"
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
    // const [_loading, setLoading] = useBoolean()
    const [balance, setBalance] = useState<string>(0)
    const [_reviews, setReviews] = useState<any[]>([])
    const [nftList, setNftList] = useState<any[]>([])
    const [nft, setNft] = useState<any>()
    const [_identityCommitment, setIdentityCommitment] = useState<string>()
    const [_proof, setProof] = useState<any>()
    const [_proofCommitment, setProofCommitment] = useState<string[]>()
    const [hasStaked,setStaked] = useState<any>()
    const [loading, setLoading] = useState<any>({
        stake: false,
        proof: false,
        verify: false
    })
    const [displayProof,setDisplay]= useState<string>()

    const toast = useToast()
    const copyToClipboard = async function (value: string) {
        navigator.clipboard.writeText(value)
        toast({
            title: 'Copied',
            // description: "We've created your account for you.",
            status: 'success',
            duration: 6000,
            isClosable: true,
          })
      }

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
    }, [contract, identity, hasStaked])

    useEffect(() => {
        const getApproved = async () => {
            if (!ercContract || !currentAccount || !contract) {
                console.log("NO contract returning")
                return;
            }
            const balance:number =await ercContract.balanceOf(currentAccount,1)
            console.log(balance,"the balance")
            if (balance > 0){
                setBalance(balance.toString())
                const approved = await ercContract.isApprovedForAll(currentAccount, contract.address) // owner, operator
                console.log('approved---', approved);
                if (!approved) {
                    const approve = await ercContract.setApprovalForAll(contract.address, true, { gasLimit: 3000000 })
                    console.log('approve---', approve);
                }
            } else {
                console.log('user has no nfts')
            }
        }
        getApproved()
    }, [ercContract, contract, currentAccount, hasStaked])
  

    useEffect(() => {
        setIdentityCommitment(identity.generateCommitment().toString())
    }, [identity])

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
            tx = await tx.wait()
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
        let r = await contract.verifyTest(utils.formatBytes32String(signal),nullifierHash,solidityProof,1,{gasLimit:4000000})
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
                that they are part of a group and that they are generating their own signals.
            </Text>

            <Divider pt="5" borderColor="gray.500" />

            <form>
                <FormControl>
                <FormLabel>NFT</FormLabel>
                <FormLabel>Balance:{balance}</FormLabel>
                </FormControl>
                {hasStaked ? (
                    <Button colorScheme="primary" mt={5} onClick={testProof}>Generate Proof</Button>   
                ) : (
                    <Button colorScheme="primary" mt={5} onClick={stakeNFT}>Stake NFT</Button>
                )}
            </form>

            <p style={{ wordWrap: "break-word",maxWidth:"1000px"}} >{displayProof}</p>
            <Divider pt="4" borderColor="gray" />

            <Stepper step={2} onPrevClick={onPrevClick} />
        </>
    )
}
