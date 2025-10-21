 import React from "react";

const SheetCard = ({ sheet }) => {
  const handleSave = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/saveSheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetId: sheet.id,
          userId: "12345", // Replace with logged-in user ID
        }),
      });

      if (!res.ok) throw new Error("Failed to save sheet");

      const data = await res.json();
      alert(data.message);
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save workspace.");
    }
  };

  return (
    <div className="p-4 transition transform border rounded shadow hover:shadow-lg hover:scale-105">
      <h2 className="mb-2 text-lg font-bold">{sheet.title || "Untitled Sheet"}</h2>
      <p className="mb-4 text-gray-600">{sheet.description || "No description"}</p>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="px-3 py-1 text-white transition bg-blue-600 rounded hover:bg-blue-700"
        >
          Save to Workspace
        </button>
        <a
          href={`/workspace/sheet/${sheet.id}`}
          className="px-3 py-1 text-white transition bg-green-600 rounded hover:bg-green-700"
        >
          View Sheet
        </a>
      </div>
    </div>
  );
};

export default SheetCard;
