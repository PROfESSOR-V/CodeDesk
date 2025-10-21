
import React, { useEffect, useState } from "react";
import SheetCard from "../components/SheetCard";

const ExploreSheets = () => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSheets = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/exploreSheets");
        if (!res.ok) throw new Error("Failed to fetch sheets");
        const data = await res.json();
        setSheets(data);
      } catch (err) {
        console.error(err);
        alert("Failed to load sheets.");
      } finally {
        setLoading(false);
      }
    };
    fetchSheets();
  }, []);

  return (
    <div className="p-6 mx-auto max-w-7xl">
      <h1 className="mb-6 text-3xl font-bold text-center">Explore Sheets</h1>
      {loading ? (
        <p className="text-center text-gray-600">Loading sheets...</p>
      ) : sheets.length === 0 ? (
        <p className="text-center text-gray-600">No sheets found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sheets.map((sheet) => (
            <SheetCard key={sheet.id} sheet={sheet} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExploreSheets;
