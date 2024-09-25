
"use client";

import { useEffect, useState } from "react";
import {
  LightSmartContractAccount,
  getDefaultLightAccountFactoryAddress,
} from "@alchemy/aa-accounts";
import { AlchemyProvider } from "@alchemy/aa-alchemy";
import { LocalAccountSigner, type Hex, SmartAccountSigner, WalletClientSigner } from "@alchemy/aa-core";
import { sepolia } from "viem/chains";
// IMP START - Quick Start
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
// IMP END - Quick Start
import Web3 from 'web3'
import { createWalletClient, custom, encodeFunctionData } from "viem";
import CounterABI from "../artifacts/contracts/Counter.sol/Counter.json";
import { ethers } from "ethers";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { getDefaultExternalAdapters } from "@web3auth/default-evm-adapter";
import { useWeb3Auth } from "@web3auth/modal-react-hooks";
import { web3AuthOptions } from "./web3AuthProviderProps";
import { loadMoonPay } from "@moonpay/moonpay-js";

require('dotenv').config()

// IMP START - SDK Initialization
// IMP START - Dashboard Registration
const clientId = process.env.NEXT_PUBLIC_CLIENT_ID as string; // get from https://dashboard.web3auth.io
// IMP END - Dashboard Registration

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x1", // Please use 0x1 for Mainnet
  rpcTarget: "https://rpc.ankr.com/eth",
  displayName: "Ethereum Mainnet",
  blockExplorer: "https://etherscan.io/",
  ticker: "ETH",
  tickerName: "Ethereum",
};


// IMP END - SDK Initialization

function App() {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [alchemyProvider, setAlchemyProvider] = useState<AlchemyProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [moonPay, setMoonPay] = useState<any>();
  const {
    initModal,
    web3Auth
  } = useWeb3Auth();



  useEffect(() => {
    const init = async () => {
      try {
        console.log(web3Auth)
        const moonPay: any = await loadMoonPay();
        const moonPaySdk = moonPay({
          flow: 'buy',
          environment: 'sandbox',
          variant: 'overlay',
          params: {
            apiKey: 'pk_test_ZJvaavYD4I3mgLjuCvZovqiyv7Iz9rs',
            theme: 'dark',
            baseCurrencyCode: 'usd',
            baseCurrencyAmount: '100',
            defaultCurrencyCode: 'eth'
          }
        });
        setMoonPay(moonPaySdk)
        if (web3Auth) {
          console.log(web3Auth)
          // Adding default evm adapters
          const adapters = await getDefaultExternalAdapters({ options: web3AuthOptions });
          adapters.forEach((adapter) => {
            web3Auth?.configureAdapter(adapter);
          });
          await initModal();
          // IMP END - SDK Initialization
          setProvider(web3Auth.provider);
          const walletClient = createWalletClient({
            chain: sepolia, // can provide a different chain here
            transport: custom(web3Auth.provider as any),
          });

          const signer: SmartAccountSigner = new WalletClientSigner(
            walletClient,
            "json-rpc" // signerType
          );
          // IMP END - Login
          const chain = sepolia;

          // Create a provider to send user operations from your smart account
          const alchemyProvider = new AlchemyProvider({
            // get your Alchemy API key at https://dashboard.alchemy.com
            apiKey: process.env.NEXT_PUBLIC_API_KEY as string,
            chain,
          }).connect(
            (rpcClient) =>
              new LightSmartContractAccount({
                rpcClient,
                owner: signer,
                chain,
                factoryAddress: getDefaultLightAccountFactoryAddress(chain),
              })
          );
          setAlchemyProvider(alchemyProvider);

          if (web3Auth.connected) {
            setLoggedIn(true);
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, [web3Auth, initModal]);

  const login = async () => {
    // IMP START - Login
    const web3authProvider = await web3Auth?.connect();
    console.log(web3authProvider);
    const web3 = new Web3(web3authProvider as any);
    console.log(web3.provider);
    console.log(await web3.eth.getAccounts());
    const walletClient = createWalletClient({
      chain: sepolia, // can provide a different chain here
      transport: custom(web3authProvider as any),
    });

    const signer: SmartAccountSigner = new WalletClientSigner(
      walletClient,
      "json-rpc" // signerType
    );
    // IMP END - Login
    setProvider(web3authProvider!);
    const chain = sepolia;

    // Create a provider to send user operations from your smart account
    const alchemyProvider = new AlchemyProvider({
      // get your Alchemy API key at https://dashboard.alchemy.com
      apiKey: process.env.NEXT_PUBLIC_API_KEY as string,
      chain,
    }).connect(
      (rpcClient) =>
        new LightSmartContractAccount({
          rpcClient,
          owner: signer,
          chain,
          factoryAddress: getDefaultLightAccountFactoryAddress(chain),
        })
    );
    setAlchemyProvider(alchemyProvider);
    if (web3Auth?.connected) {
      setLoggedIn(true);
    }
  };

  const getUserInfo = async () => {
    // IMP START - Get User Information
    const user = await web3Auth?.getUserInfo();
    const privateKey = await provider?.request({
      method: "eth_private_key",
    });

    // IMP END - Get User Information
    uiConsole(privateKey);
  };

  const logout = async () => {
    // IMP START - Logout
    await web3Auth?.logout();
    // IMP END - Logout
    setProvider(null);
    setLoggedIn(false);
    uiConsole("logged out");
  };

  // IMP START - Blockchain Calls
  const getAccounts = async () => {
    if (!alchemyProvider) {
      uiConsole("provider not initialized yet");
      return;
    }

    // Get user's Ethereum public address
    const ethersProvider = new ethers.BrowserProvider(provider!)

    // For ethers v5
    // const signer = ethersProvider.getSigner();
    const signer = await ethersProvider.getSigner();

    // Get user's Ethereum public address
    const address = await signer.getAddress();
    console.log(address)
    uiConsole(address);
  };

  const getBalance = async () => {
    if (!alchemyProvider) {
      uiConsole("provider not initialized yet");
      return;
    }

    // For ethers v5
    // const ethersProvider = new ethers.providers.Web3Provider(this.provider);
    const ethersProvider = new ethers.BrowserProvider(provider!);
    // For ethers v5
    // const signer = ethersProvider.getSigner();
    const signer = await ethersProvider.getSigner();

    // Get user's Ethereum public address
    const address = signer.getAddress();
    console.log(address)
    // Get user's balance in ether
    // For ethers v5
    // const balance = ethers.utils.formatEther(
    // await ethersProvider.getBalance(address) // Balance is in wei
    // );
    const balance = ethers.formatEther(
      await ethersProvider.getBalance(address) // Balance is in wei
    );
    uiConsole(balance);
  };

  const increment = async () => {
    const uoCallData = encodeFunctionData({
      abi: CounterABI.abi,
      functionName: "increment"
    });
    console.log(alchemyProvider)
    alchemyProvider?.withAlchemyGasManager({
      policyId: "beb2f7bb-0a7f-469f-90c3-3ac756dbb7fb", // replace with your policy id, get yours at https://dashboard.alchemy.com/
    });

    // If gas sponsorship ineligible, baypass paymaster middleware by passing in the paymasterAndData override

    // Empty paymasterAndData indicates that there will be no paymaster involved
    // and the user will be paying for the gas fee even when `withAlchemyGasManager` is configured on the provider

    const elligibility = await alchemyProvider?.checkGasSponsorshipEligibility({
      target: "0xB043083EcF02012b58FBCDe05234AB6818334Cc1",
      data: uoCallData
    });
    console.log(elligibility);
    // if `elligibility` === false, inform users about their ineligibility,
    // either notifying or asking for consent to proceed with gas fee being paid from their account balance

    // To proceed with bypassing the paymster middleware
    const overrides: any = { paymasterAndData: "0x" };

    const uo = await alchemyProvider?.sendUserOperation(
      {
        target: "0xB043083EcF02012b58FBCDe05234AB6818334Cc1",
        data: uoCallData,
      },
      elligibility ? undefined : overrides // for ineligible user operations, set the paymasterAndData override
    );

    const txHash = await alchemyProvider?.waitForUserOperationTransaction(uo!.hash);

    console.log(txHash);
  }

  const decrement = async () => {
    const uoCallData = encodeFunctionData({
      abi: CounterABI.abi,
      functionName: "decrement"
    });
    alchemyProvider?.withAlchemyGasManager({
      policyId: "beb2f7bb-0a7f-469f-90c3-3ac756dbb7fb", // replace with your policy id, get yours at https://dashboard.alchemy.com/
    });

    const elligibility = await alchemyProvider?.checkGasSponsorshipEligibility({
      target: "0xB043083EcF02012b58FBCDe05234AB6818334Cc1",
      data: uoCallData
    });
    console.log(elligibility);
    // if `elligibility` === false, inform users about their ineligibility,
    // either notifying or asking for consent to proceed with gas fee being paid from their account balance

    // To proceed with bypassing the paymster middleware
    const overrides: any = { paymasterAndData: "0x" };

    const uo = await alchemyProvider?.sendUserOperation(
      {
        target: "0xB043083EcF02012b58FBCDe05234AB6818334Cc1",
        data: uoCallData,
      },
      elligibility ? undefined : overrides // for ineligible user operations, set the paymasterAndData override
    );

    const txHash = await alchemyProvider?.waitForUserOperationTransaction(uo!.hash);

    console.log(txHash);
  }

  const tripleIncrement = async () => {
    const uoCallData = encodeFunctionData({
      abi: CounterABI.abi,
      functionName: "increment"
    });
    alchemyProvider?.withAlchemyGasManager({
      policyId: process.env.NEXT_PUBLIC_POLICY_ID as string, // replace with your policy id, get yours at https://dashboard.alchemy.com/
    });

    const elligibility = await alchemyProvider?.checkGasSponsorshipEligibility({
      target: "0xB043083EcF02012b58FBCDe05234AB6818334Cc1",
      data: uoCallData
    });
    console.log(elligibility);
    // if `elligibility` === false, inform users about their ineligibility,
    // either notifying or asking for consent to proceed with gas fee being paid from their account balance

    // To proceed with bypassing the paymster middleware
    const overrides: any = { paymasterAndData: "0x" };

    const uo = await alchemyProvider?.sendUserOperation([
      {
        target: "0xB043083EcF02012b58FBCDe05234AB6818334Cc1",
        data: uoCallData,
      },
      {
        target: "0xB043083EcF02012b58FBCDe05234AB6818334Cc1",
        data: uoCallData,
      },
      {
        target: "0xB043083EcF02012b58FBCDe05234AB6818334Cc1",
        data: uoCallData,
      },
    ],
      elligibility ? undefined : overrides // for ineligible user operations, set the paymasterAndData override
    );

    const txHash = await alchemyProvider?.waitForUserOperationTransaction(uo!.hash);

    console.log(txHash);
  }

  const tripleDecrement = async () => {
    const uoCallData = encodeFunctionData({
      abi: CounterABI.abi,
      functionName: "decrement"
    });
    alchemyProvider?.withAlchemyGasManager({
      policyId: process.env.NEXT_PUBLIC_POLICY_ID as string, // replace with your policy id, get yours at https://dashboard.alchemy.com/
    });

    const elligibility = await alchemyProvider?.checkGasSponsorshipEligibility({
      target: "0xB043083EcF02012b58FBCDe05234AB6818334Cc1",
      data: uoCallData
    });
    console.log(elligibility);
    // if `elligibility` === false, inform users about their ineligibility,
    // either notifying or asking for consent to proceed with gas fee being paid from their account balance

    // To proceed with bypassing the paymster middleware
    const overrides: any = { paymasterAndData: "0x" };

    const uo = await alchemyProvider?.sendUserOperation([
      {
        target: "0xB043083EcF02012b58FBCDe05234AB6818334Cc1",
        data: uoCallData,
      },
      {
        target: "0xB043083EcF02012b58FBCDe05234AB6818334Cc1",
        data: uoCallData,
      },
      {
        target: "0xB043083EcF02012b58FBCDe05234AB6818334Cc1",
        data: uoCallData,
      },
    ],
      elligibility ? undefined : overrides // for ineligible user operations, set the paymasterAndData override
    );

    const txHash = await alchemyProvider?.waitForUserOperationTransaction(uo!.hash);

    console.log(txHash);
  }

  const signMessage = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const web3 = new Web3(provider as any);

    // Get user's Ethereum public address
    const fromAddress = (await web3.eth.getAccounts())[0];

    const originalMessage = "YOUR_MESSAGE";

    // Sign the message
    const signedMessage = await web3.eth.personal.sign(
      originalMessage,
      fromAddress,
      "test password!" // configure your own password here.
    );
    uiConsole(signedMessage);
  };
  // IMP END - Blockchain Calls

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
      console.log(...args);
    }
  }

  const loggedInView = (
    <>
      <div className="flex-container">
        <div>
          <button onClick={() => moonPay?.show()} className="card">
            Pay
          </button>
        </div>
        <div>
          <button onClick={getUserInfo} className="card">
            Get User Info
          </button>
        </div>
        <div>
          <button onClick={getAccounts} className="card">
            Get Accounts
          </button>
        </div>
        <div>
          <button onClick={getBalance} className="card">
            Get Balance
          </button>
        </div>
        <div>
          <button onClick={increment} className="card">
            Increment
          </button>
        </div>
        <div>
          <button onClick={decrement} className="card">
            Decrement
          </button>
        </div>
        <div>
          <button onClick={tripleIncrement} className="card">
            Increment x 3
          </button>
        </div>
        <div>
          <button onClick={tripleDecrement} className="card">
            Decrement x 3
          </button>
        </div>
        <div>
          <button onClick={signMessage} className="card">
            Sign Message
          </button>
        </div>
        <div>
          <button onClick={logout} className="card">
            Log Out
          </button>
        </div>
      </div>
    </>
  );

  const unloggedInView = (
    <button onClick={login} className="card">
      Login
    </button>
  );

  return (
    <div className="container">
      <h1 className="title">
        <a target="_blank" href="https://web3auth.io/docs/sdk/pnp/web/modal" rel="noreferrer">
          Web3Auth{" "}
        </a>
        & NextJS Quick Start
      </h1>

      <div className="grid">{loggedIn ? loggedInView : unloggedInView}</div>
      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}></p>
      </div>

      <footer className="footer">
        <a
          href="https://github.com/Web3Auth/web3auth-pnp-examples/tree/main/web-modal-sdk/quick-starts/nextjs-modal-quick-start"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source code
        </a>
      </footer>
    </div>
  );
}

export default App;
