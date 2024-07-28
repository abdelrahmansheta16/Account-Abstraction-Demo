"use client"

import { Web3AuthContextConfig, Web3AuthInnerContext, Web3AuthProvider } from "@web3auth/modal-react-hooks";
import "./globals.css";

import { Inter } from "next/font/google";
import { Web3AuthOptions } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { WalletServicesProvider } from "@web3auth/wallet-services-plugin-react-hooks";
import { web3AuthContextConfig } from "./web3AuthProviderProps";

const inter = Inter({ subsets: ["latin"] });

// eslint-disable-next-line no-undef
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Web3AuthProvider config={web3AuthContextConfig}>
      <WalletServicesProvider context={Web3AuthInnerContext}>
        <html lang="en">
          <body className={inter.className}>{children}</body>
        </html>
      </WalletServicesProvider>
    </Web3AuthProvider>

  );
}
