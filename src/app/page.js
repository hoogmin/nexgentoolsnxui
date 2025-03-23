"use client"

import { useRef } from "react";

export default function Home() {
  // Refs for both code input and lock type select so we don't trigger unneeded re-renders.
  const codeRef = useRef(null);
  const lockTypeRef = useRef(null);

  return (
    <main className="min-h-screen min-w-screen flex flex-col justify-items-center ribbon">
      <div className="flex flex-col text-center mx-auto my-9">
        <h1 className="text-2xl">NX500</h1>
        <h2 className="text-base">safe-locksmith.com</h2>
        <p className="text-base">v1.0</p>
      </div>
      <div className="flex flex-col space-x-2 text-center mx-auto my-2">
        <p className="text-base" id="keypadStatus">
          <span className="status-dot initializing mr-1.5"></span>
          Keypad initializing
        </p>
        <p className="text-base" id="powerInfo">
          <span className="status-dot ok mr-1.5"></span>
          Battery Voltage 9.0V Consumption 10.0 mW
        </p>
      </div>
      <div className="flex flex-col space-y-1.5 text-center mx-auto my-2">
        <label htmlFor="lockType">Select Lock Type</label>
        <select name="lockType" id="lockType" ref={lockTypeRef}>
          <option value="ESL5">ESL5</option>
          <option value="ESL10/20">ESL10/20</option>
          <option value="S&G">S&G</option>
          <option value="LG">LG</option>
          <option value="NL">NL</option>
          <option value="SecuRam">SecuRam</option>
        </select>
        <label htmlFor="code">Code</label>
        <input name="code" id="code" type="text" placeholder="e.g. 12345" ref={codeRef}/>
        <button className="nxbutton mt-4" id="btnSendCode">Send Code</button>
        <button className="nxbutton" id="btnCheckForLockout">Check For Lockout</button>
      </div>
    </main>
  );
}
