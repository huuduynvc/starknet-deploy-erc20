import { Account, Calldata, CallData, Contract, json, RpcProvider, cairo, Uint256 } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });
  console.log("Provider connected to Starknet mainet");

  const privateKey0 = process.env.PRIVATE_KEY ?? "";
  const accountAddress0: string = process.env.WALLET_ADDRESS ?? "";
  const account0 = new Account(provider, accountAddress0, privateKey0);
  console.log("Account 0 connected\n");


  console.log("Deployment Tx - ERC20 Contract to Starknet...");
  const compiledErc20mintable = json.parse(fs.readFileSync("compiled_contracts/ERC20MintableOZ051.json").toString("ascii"));
  const erc20CallData: CallData = new CallData(compiledErc20mintable.abi);
  const decimal = 18;
  const initialTk: Uint256 = cairo.uint256(1000000 * 10 ** decimal);
  const ERC20ConstructorCallData: Calldata = erc20CallData.compile("constructor", {
    name: "HodlLessETH",
    symbol: "HLETH",
    decimals: decimal,
    initial_supply: initialTk,
    recipient: account0.address,
    owner: account0.address
  });

  console.log("constructor=", ERC20ConstructorCallData);
  const deployERC20Response = await account0.declareAndDeploy({
    contract: compiledErc20mintable,
    constructorCalldata: ERC20ConstructorCallData
  });
  console.log("ERC20 declared hash: ", deployERC20Response.declare.class_hash);
  console.log("ERC20 deployed at address: ", deployERC20Response.deploy.contract_address);

  const erc20Address = deployERC20Response.deploy.contract_address;

  const erc20 = new Contract(compiledErc20mintable.abi, erc20Address, provider);
  erc20.connect(account0);

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });