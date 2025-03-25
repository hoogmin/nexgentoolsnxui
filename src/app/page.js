"use client"

import { useEffect, useRef, useReducer } from "react";

const statusInitialState = {
  redStatusMessage: "...",
  greenStatusMessage: "...",
  whiteStatusMessage: "...",
  batteryVoltageStatusMessage: "...",
  batteryVoltage: 100,
  consumption: "...",
};

function statusReducer(_, newState) {
  return newState;
}

export default function Home() {
  // Refs for both code input and lock type select so we don't trigger unneeded re-renders.
  const codeRef = useRef(null);
  const lockTypeRef = useRef(null);

  // State data for various pieces of UI.
  const [statusData, setStatusData] = useReducer(statusReducer, statusInitialState);

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
      console.log("WS connected.");
      startHeartbeat();
    }

    socket.onclose = () => {
      console.log("WS disconnected.");
      stopHeartbeat();
    }

    socket.onerror = (e) => {
      console.error(`WS error occurred.`);
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
    
    setStatusData(commandData);
  }

  const sendCodeToNXDevice = (e) => {
    const lockSelected = getSelectedLock();
    const safeCode = codeRef.current.value;

    if (!safeCode) {
      return;
    }

    const command = { type: "t_sentnum", value: safeCode, value2: lockSelected };
    socketRef.current.send(JSON.stringify(command));
  }

  const checkLockoutOnNXDevice = (e) => {
    const lockSelected = getSelectedLock();

    const command = { type: "btn_lockout", value: lockSelected };
    socketRef.current.send(JSON.stringify(command));
  }

  const lockChanged = () => {
    let lockSelected = getSelectedLock();

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

  const handleEnterPressedOnCodeInput = (e) => {
    if (e.key === "Enter") {
      sendCodeToNXDevice(e);
    }
  }

  // Return the lock number associated with a given lock type.
  const getSelectedLock = () => {
    let lockSelected = 0;

    switch (lockTypeRef.current.value) {
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
      case "SELECT":
        lockSelected = 0;
        break;
      default:
        lockSelected = 0;
        break;
    }

    return lockSelected;
  }

  return (
    <main className="min-h-screen min-w-screen flex flex-col justify-items-center ribbon">
      <div className="flex flex-col text-center mx-auto my-9">
        <h1 className="text-2xl">NX500</h1>
        <h2 className="text-base">safe-locksmith.com</h2>
        <p className="text-base">v1.0</p>
      </div>
      <div className="flex flex-col text-start mx-auto my-2 w-50">
        <p className="text-base text-red-500 animated-text">
          <span className="status-dot red mr-1.5"></span>
          {statusData.redStatusMessage}
        </p>
        <p className="text-base text-green-500 animated-text">
          <span className="status-dot green mr-1.5"></span>
          {statusData.greenStatusMessage}
        </p>
        <p className="text-base text-white animated-text">
          <span className="status-dot white mr-1.5"></span>
          {statusData.whiteStatusMessage}
        </p>
        <p className="text-base text-yellow-300 animated-text">
          <span className="status-dot yellow mr-1.5"></span>
          {statusData.batteryVoltageStatusMessage} {statusData.consumption}
        </p>
        <div className="text-base text-center">
          <label htmlFor="voltage" className="text-yellow-300">Voltage Meter</label>
          <meter
          className="w-full"
          id="voltage"
          min={45}
          max={100}
          low={51}
          high={76}
          optimum={80}
          value={statusData.batteryVoltage}
          >
          </meter>
        </div>
      </div>
      <div className="flex flex-col space-y-1.5 text-center mx-auto my-2">
        <label htmlFor="lockType">Select Lock Type</label>
        <select name="lockType" id="lockType" ref={lockTypeRef} onChange={lockChanged}>
          <option value="SELECT">Select Lock Type...</option>
          <option value="ESL5">ESL5</option>
          <option value="ESL10/20">ESL10/20</option>
          <option value="S&G">S&G</option>
          <option value="LG">LG</option>
          <option value="NL">NL</option>
          <option value="SecuRam">SecuRam</option>
          <option value="ExtAccessory">Ext. Accessory</option>
        </select>
        <label htmlFor="code">Code</label>
        <input name="code" maxLength={19} id="code" type="text" placeholder="Enter safe code here" ref={codeRef} onKeyDown={handleEnterPressedOnCodeInput}/>
        <button className="nxbutton mt-4" id="btnSendCode" onClick={sendCodeToNXDevice}>Send Code</button>
        <button className="nxbutton" id="btnCheckForLockout" onClick={checkLockoutOnNXDevice}>Check For Lockout</button>
      </div>
    </main>
  );
}
