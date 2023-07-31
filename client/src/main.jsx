import React from "react";
import ReactDOM from "react-dom/client";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import ErrorBoundary from "./utils/ErrorBoundary";

import {
  Battleground,
  CreateBattle,
  MyChampion,
  Battle,
  Home,
  JoinBattle,
  Colosseum,
  RecruitmentGuild,
  TrainingGuild,
  Shop,
  ItemShop,
  WeaponShop,
  MagicShop,
  InnPage,
  Withdraw,
  BattleHistory,
} from "./page";
import { OnboardModal, Navbar } from "./components";
import { GlobalContextProvider } from "./context";
import "./index.css";

const client = new ApolloClient({
  uri: "https://api.studio.thegraph.com/query/37725/wiwa/version/latest",
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <BrowserRouter>
      <ThirdwebProvider
        activeChain="mumbai"
        clientId="19a7b18a9e9f95b2f29ea0f8331aa7ee"
        sdkOptions={{
          gatewayUrls: ["https://w3s.link/ipfs/"],
        }}
      >
        <ApolloProvider client={client}>
          <GlobalContextProvider>
            <Navbar />
            <OnboardModal />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/battleground" element={<Battleground />} />
              <Route path="/battle/:battleName" element={<Battle />} />
              <Route path="/create-battle" element={<CreateBattle />} />
              <Route path="/join-battle" element={<JoinBattle />} />
              <Route path="/battle-history" element={<BattleHistory />} />
              <Route path="/colosseum" element={<Colosseum />} />
              <Route path="/recruitment-guild" element={<RecruitmentGuild />} />
              <Route path="/my-champions" element={<MyChampion />} />
              <Route path="/training-guild" element={<TrainingGuild />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/weapon-armor-shop" element={<ItemShop />} />
              <Route path="/item-shop" element={<WeaponShop />} />
              <Route path="/magic-trinket-shop" element={<MagicShop />} />
              <Route path="/inn" element={<InnPage />} />
              <Route path="/withdraw" element={<Withdraw />} />
            </Routes>
          </GlobalContextProvider>
        </ApolloProvider>
      </ThirdwebProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
