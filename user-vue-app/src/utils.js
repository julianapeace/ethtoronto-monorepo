import {
  generateMerkleProof,
  genSignalHash,
  MerkleProof,
  Semaphore
} from "@zk-kit/protocols";
import { Strategy, ZkIdentity } from "@zk-kit/identity";
import { ethers } from "ethers";
const wasmFilePath = "./build/snark/semaphore.wasm";
const finalZkeyPath = "./build/snark/semaphore_final.zkey";
export const SnarkScalarField = BigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);
export const TreeZeroNode =
  BigInt(ethers.utils.solidityKeccak256(["string"], ["Semaphore"])) %
  SnarkScalarField;

/**
 * @param {any} leaves
 * @param {any} leaf
 */
export function createMerkleProof(leaves, leaf) {
  return generateMerkleProof(20, TreeZeroNode, 2, leaves, leaf);
}
//const encoded1 = new Buffer.from(s).toString('hex');

/**
 * @param {any} groupId
 * @param {{ genIdentityCommitment: () => any; getNullifier: () => any; getTrapdoor: () => any; }} identity
 * @param {any} treeLeaves
 * @param {any} challenge
 */
export async function generateMerkleProofNullifierHash(
  groupId,
  identityCommit,
  treeLeaves,
  challenge
) {
  const identityCommit = identity.genIdentityCommitment();
  const merkleProof = createMerkleProof(treeLeaves, identityCommit);
  const nullifierHash = Semaphore.genNullifierHash(
    groupId,
    identity.getNullifier()
  );
  const witness = Semaphore.genWitness(
    identity.getTrapdoor(),
    identity.getNullifier(),
    merkleProof,
    groupId,
    challenge
  );
  const fullProof = await Semaphore.genProof(
    witness,
    wasmFilePath,
    finalZkeyPath
  );
  const solidityProof = Semaphore.packToSolidityProof(fullProof);
  return { proof: solidityProof, nullifierHash: nullifierHash };
}

/**
 * @param {any} groupId
 * @param {{ genIdentityCommitment: () => any; getNullifier: () => any; getTrapdoor: () => any; }} identity
 * @param {any} treeLeaves
 * @param {any} challenge
 */
export async function generateIdentityProofasHex(
  groupId,
  identity,
  treeLeaves,
  challenge
) {
  const identityCommit = identity.genIdentityCommitment();
  const merkleProof = createMerkleProof(treeLeaves, identityCommit);
  const nullifierHash = Semaphore.genNullifierHash(
    groupId,
    identity.getNullifier()
  );
  const witness = Semaphore.genWitness(
    identity.getTrapdoor(),
    identity.getNullifier(),
    merkleProof,
    groupId,
    challenge
  );
  const fullProof = await Semaphore.genProof(
    witness,
    wasmFilePath,
    finalZkeyPath
  );
  const solidityProof = Semaphore.packToSolidityProof(fullProof);
  const params = {
    proof: solidityProof,
    nullifierHash: nullifierHash.toString(),
    entityId: groupId,
    challenge: challenge,
  };

  console.log(params);
  // @ts-ignore
  const hexified = new Buffer.from(JSON.stringify(params)).toString("hex");
  return `0x${hexified}`;
}
