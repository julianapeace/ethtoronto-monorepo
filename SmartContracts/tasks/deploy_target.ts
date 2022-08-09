import { Contract } from 'ethers'
import { task, types } from 'hardhat/config'
import { poseidon_gencontract as poseidonContract } from 'circomlibjs'
//n/a


task('deploy_target', '')
  .addOptionalParam<boolean>('logs', 'Print the logs', true, types.boolean)
  .addParam('nft','constructor nft')
  .setAction(
    async ({ logs ,nft}, hre): Promise<Contract | void> => {
      const poseidonABI = poseidonContract.generateABI(2)
      const poseidonBytecode = poseidonContract.createCode(2)
      hre.run('compile')
      const [signer] = await hre.ethers.getSigners()

      const PoseidonLibFactory = new hre.ethers.ContractFactory(
        poseidonABI,
        poseidonBytecode,
        signer,
      )
      const poseidonLib = await PoseidonLibFactory.deploy()

      const Verifier20 = await hre.ethers.getContractFactory('Verifier20')
      const instance = await Verifier20.deploy()

      await instance.deployed()

      logs &&
        console.log(
          `verfier contract has been deployed to: ${instance.address}`,
        )

      await poseidonLib.deployed()
      logs &&
        console.log(
          `Poseidon library has been deployed to: ${poseidonLib.address}`,
        )
      console.log('deploying')
      const IncrementalBinaryTreeLibFactory = await hre.ethers.getContractFactory(
        'IncrementalBinaryTree',
        {
          libraries: {
            PoseidonT3: poseidonLib.address,
          },
        },
      )

      const incrementalBinaryTreeLib = await IncrementalBinaryTreeLibFactory.deploy()

      await incrementalBinaryTreeLib.deployed()

      logs &&
        console.log(
          `IncrementalBinaryTree library has been deployed to: ${incrementalBinaryTreeLib.address}`,
        )

      let target
      const StakingFactory = await hre.ethers.getContractFactory(
        'Staking',
        {
          libraries: {
            IncrementalBinaryTree: incrementalBinaryTreeLib.address,
          },
        },
      )
     
      target=await StakingFactory.deploy(instance.address,nft)
      await target?.deployed()

      logs &&
        console.log(`Target contract has been deployed to: ${target?.address}`)

      if (target) {
        return target
      }
    },
  )
