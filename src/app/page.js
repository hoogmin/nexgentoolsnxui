"use client"

import { useEffect, useRef, use } from "react";

export default function Home() {
  // Refs for both code input and lock type select so we don't trigger unneeded re-renders.
  const codeRef = useRef(null);
  const lockTypeRef = useRef(null);

  // State data for various pieces of UI.
  const redStatusText = use("");
  const greenStatusText = use("");
  const whiteStatusText = use("");
  const batteryVoltageStatusMessageText = use("");
  const consumptionText = use("");

  // Initialize WebSocket for real-time communication with device. Since it involves side-effects,
  // (an external system connection) than useEffect (run once on mount) is appropriate here.
  const socketRef = useRef(null);
  const heartbeatRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket(`ws://${window.location.hostname}:81/`);
    socketRef.current = socket;

    socket.onmessage = (e) => {
      processCommandFromNXDevice(e);
    }

    socket.onopen = () => {
      console.log("Device connected.");
      startHeartbeat();
    }

    socket.onclose = () => {
      console.log("Device disconnected.");
      stopHeartbeat();
    }

    socket.onerror = (error) => {
      console.error(`Device connection error: ${error}`);
    }

    // Cleanup WebSocket when component unmounts
    return () => {
      socket.close();
      stopHeartbeat();
    }
  }, []);

  const processCommandFromNXDevice = (e) => {
    const commandPayload = JSON.parse(e.data);

    // A strange interface but it is how the device sends commands
    // to the client.
    const commandData = {
      redStatusMessage: commandPayload.msg1, // Warnings/Errors
      greenStatusMessage: commandPayload.msg2, // Keypad/Lock status
      whiteStatusMessage: commandPayload.msg3, // Other messages
      batteryVoltageStatusMessage: commandPayload.msg4, // Voltage text string
      batteryVoltage: commandPayload.msg5, // number representing voltage
      consumption: commandPayload.msg6, // power consumption text string, milliwatts
    };

    redStatusText.set(commandData.redStatusMessage);
    greenStatusText.set(commandData.greenStatusMessage);
    whiteStatusText.set(commandData.whiteStatusMessage);
    batteryVoltageStatusMessageText.set(commandData.batteryVoltageStatusMessage);
    consumptionText.set(commandData.consumption);
  }

  const sendCodeToNXDevice = (e) => {

  }

  const checkLockoutOnNXDevice = (e) => {

  }

  const lockChanged = () => {
    let lockSelected = 0;

    switch (lockTypeRef.current) {
      case "ESL5":
        lockSelected = 1;
        break;
      case "ESL10/20":
        lockSelected = 2;
        break;
      case "S&G":
        lockSelected = 3;
        break;
      case "LG":
        lockSelected = 4;
        break;
      case "NL":
        lockSelected = 5;
        break;
      case "SecuRam":
        lockSelected = 6;
        break;
      case "ExtAccessory":
        lockSelected = 7;
        break;
      default:
        lockSelected = 0;
        console.log("Selected lock is invalid.");
        break;
    }

    console.log(`Selected lock: ${lockSelected}`);
    const command = { type: "LED_selected", value: lockSelected };
    socketRef.current.send(JSON.stringify(command));
  }

  // Keep-Alive mechanism: Sends a "ping" to device every 2 minutes
  const startHeartbeat = () => {
    heartbeatRef.current = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send("ping");
      }
    }, 2 * 60 * 1000);
  }

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }

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
        <select name="lockType" id="lockType" ref={lockTypeRef} onChange={lockChanged}>
          <option value="ESL5">ESL5</option>
          <option value="ESL10/20">ESL10/20</option>
          <option value="S&G">S&G</option>
          <option value="LG">LG</option>
          <option value="NL">NL</option>
          <option value="SecuRam">SecuRam</option>
          <option value="ExtAccessory">Ext. Accessory</option>
        </select>
        <label htmlFor="code">Code</label>
        <input name="code" id="code" type="text" placeholder="e.g. 12345" ref={codeRef}/>
        <button className="nxbutton mt-4" id="btnSendCode">Send Code</button>
        <button className="nxbutton" id="btnCheckForLockout">Check For Lockout</button>
      </div>
    </main>
  );
}
