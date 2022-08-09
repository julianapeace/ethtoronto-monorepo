import { Box, Button, Divider, Heading, HStack, Link, Text, useBoolean, VStack } from "@chakra-ui/react"
import { Group } from "@semaphore-protocol/group"
import { Identity } from "@semaphore-protocol/identity"
import { generateProof, packToSolidityProof } from "@semaphore-protocol/proof"
import { Contract, Signer } from "ethers"
import { parseBytes32String } from "ethers/lib/utils"
import { useCallback, useEffect, useState } from "react"
import IconAddCircleFill from "../icons/IconAddCircleFill"
import IconRefreshLine from "../icons/IconRefreshLine"
import Stepper from "./Stepper"

export type ProofStepProps = {
    signer?: Signer
    contract?: Contract
    identity: Identity
    event: any
    onPrevClick: () => void
    onLog: (message: string) => void
}

export default function ProofStep({ signer, contract, event, identity, onPrevClick, onLog }: ProofStepProps) {
    const [_loading, setLoading] = useBoolean()
    const [_reviews, setReviews] = useState<any[]>([])

    const getReviews = useCallback(async () => {
        if (!signer || !contract) {
            return []
        }

        const reviews = await contract.queryFilter(contract.filters.ReviewPosted(event.groupId))

        return reviews.map((r) => parseBytes32String(r.args![1]))
    }, [signer, contract, event])

    useEffect(() => {
        getReviews().then(setReviews)
    }, [signer, contract, event])

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

            <HStack pt="5" justify="space-between">
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
            )}

            <Divider pt="4" borderColor="gray" />

            <Stepper step={3} onPrevClick={onPrevClick} />
        </>
    )
}
