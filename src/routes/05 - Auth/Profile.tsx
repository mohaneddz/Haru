import { createSignal, onMount } from "solid-js";

import { dropDummy, testDummy, testInert, testUpdate, testDelete, testGetAll, testGetById } from "@/database/api/test";

function Button(props) {
  return (
    <button
      class="px-2 py-3 hover:brightness-95 hover:cursor-pointer hover:scale-95 active:scale-100 bg-accent text-white rounded-sm"
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

export default function Profile() {
  const [parameters, setParameters] = createSignal("");
  const [result, setResult] = createSignal("");

  // Initialize database table on component mount
  onMount(async () => {
    try {
      await dropDummy();
      await testDummy();
      console.log("Database table initialized");
    } catch (err) {
      console.error("Error initializing database:", err);
    }
  });

  const Insert = async () => {
    try {
      const res = await testInert();
      setResult(JSON.stringify(res, null, 2));
      setParameters(""); // Clear parameters after insertion
    } catch (err) {
      console.error("Error inserting data:", err);
      setResult(`Error: ${err.message}`);
      alert("Failed to insert data.");
    }
  };

  const Delete = async () => {
    try {
      const res = await testDelete();
      setResult(JSON.stringify(res, null, 2));
    } catch (err) {
      console.error("Error deleting data:", err);
      setResult(`Error: ${err.message}`);
      alert("Failed to delete data.");
    }
  };

  const Update = async () => {
    try {
      // Update doesn't need parameters since it updates all rows
      const res = await testUpdate();
      setResult(JSON.stringify(res, null, 2));
    } catch (err) {
      console.error("Error updating data:", err);
      setResult(`Error: ${err.message}`);
      alert("Failed to update data.");
    }
  };

  const GetAll = async () => {
    try {
      const res = await testGetAll();
      setResult(JSON.stringify(res, null, 2));
    } catch (err) {
      console.error("Error fetching all data:", err);
      setResult(`Error: ${err.message}`);
      alert("Failed to fetch all data.");
    }
  };

  const GetById = async () => {
    const params = parameters().trim();
    if (!params) {
      alert("Please provide an ID to fetch.");
      return;
    }
    try {
      const res = await testGetById(params);
      setResult(JSON.stringify(res, null, 2));
    } catch (err) {
      console.error("Error fetching by ID:", err);
      setResult(`Error: ${err.message}`);
      alert("Failed to fetch data by ID.");
    }
  };

  return (
    <div class="h-full w-full flex items-center justify-center flex-col gap-8">
      <h1 class="text-5xl">DB Testground</h1>

      <div class="grid grid-cols-3 gap-4">
        <Button onClick={Insert}>Insert</Button>
        <Button onClick={Update}>Update All</Button>
        <Button onClick={Delete}>Delete All</Button>
        <Button onClick={GetAll}>Get All</Button>
        <Button onClick={GetById}>Get By ID</Button>
      </div>

      <h3 class="text-2xl">Parameters</h3>
      <input 
        type="number" 
        name="parameters" 
        id="db_parameters" 
        class="bg-sidebar-light-1 border-bordedr border-1 px-2 py-1 rounded"
        value={parameters()}
        onInput={(e) => setParameters(e.target.value)}
        placeholder="Enter ID for Get By ID"
      />

      <h3 class="text-2xl">Result</h3>
      <textarea 
        name="result" 
        class="bg-sidebar-light-1 border-bordedr border-1 px-2 py-1 rounded w-96 h-32"
        id="db_result"
        value={result()}
        readonly
        placeholder="Results will appear here..."
      />
    </div>
  );
}