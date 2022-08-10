//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@semaphore-protocol/contracts/interfaces/IVerifier.sol";
import "@semaphore-protocol/contracts/base/SemaphoreCore.sol";
import "@semaphore-protocol/contracts/base/SemaphoreGroups.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
contract Staking is ERC721Holder,SemaphoreCore, SemaphoreGroups, Ownable {
    mapping(uint256 => uint256) public groupDeposits;
    mapping(uint256 => uint256[]) public groupCommitments;
    mapping(address => uint256) private entities;
    mapping(uint256 => address) public membershipTokens;
    mapping(uint256 => uint256) public commitmentNFTs;
    
    IVerifier verifier;

   
    address public asset;
    
    

    constructor(
        address _verifier,        
        address nft
    ) {
        verifier = IVerifier(_verifier);
        
       
        createEntity(1,msg.sender,nft);
      
    }

    

    
    function createEntity(
        uint256 entityId,
        address editor,
        address token
    ) public {
        _createGroup(entityId, 20, 0);

        entities[editor] = entityId;
        membershipTokens[entityId] = token;
      
    }

    /// @dev See {ISemaphoreWhistleblowing-addWhistleblower}.
    function addDAOIdentity(
        uint256 entityId,
        uint256 identityCommitment,
        uint256 id
    ) public {
        IERC721(membershipTokens[entityId]).safeTransferFrom(
            msg.sender,
            address(this),
            id
        );
        groupCommitments[entityId].push(identityCommitment);
        commitmentNFTs[entityId] = id;
        _addMember(entityId, identityCommitment);
    }
    function addTestCommitment(uint256 entity, uint256 identityCommitment)
        public
    {
        //default to pool one
        groupCommitments[entity].push(identityCommitment);
        _addMember(entity, identityCommitment);
    }

    function getTreeInfo(uint256 id)
        public
        view
        returns (uint256[] memory, uint256)
    {
        return (groupCommitments[id], getRoot(id));
    }

   

    function verifyTest(
        bytes32 _sig,
        uint256 _nullifierHash,
        uint256[8] calldata _proof,
        uint256 entityId
    ) public view returns(bool){
        uint256 root = getRoot(entityId);

        _verifyProof(_sig, root, _nullifierHash, root, _proof, verifier);
        return true;
    }

    function verify(
        bytes32 _sig,
        uint256 _nullifierHash,
        uint256[8] calldata _proof,
        uint256 entityId
    ) internal returns (bool) {
        uint256 root = getRoot(entityId);

        _verifyProof(_sig, root, _nullifierHash, root, _proof, verifier);

        // Prevent double-greeting (nullifierHash = hash(root + identityNullifier)).
        // Every user can greet once.
        _saveNullifierHash(_nullifierHash);
        return true;
    }
}
