import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

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
} from "./page";
import { OnboardModal, Navbar } from "./components";
import { GlobalContextProvider } from "./context";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <GlobalContextProvider>
      <Navbar />
      <OnboardModal />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/battleground" element={<Battleground />} />
        <Route path="/battle/:battleName" element={<Battle />} />
        <Route path="/create-battle" element={<CreateBattle />} />
        <Route path="/join-battle" element={<JoinBattle />} />
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
  </BrowserRouter>
);
