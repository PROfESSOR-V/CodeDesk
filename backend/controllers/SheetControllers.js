import supabase from "../config/supabaseClient.js";

/**
 * @desc    Fetch all global sheets available in Supabase
 * @route   GET /api/sheets/explore
 * @access  Public
 */
export const getExploreSheets = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("sheets")
      .select("id, title, description, educator_name, sheet_url");

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching sheets:", error.message);
    res.status(500).json({
      message: "Failed to fetch sheets",
      error: error.message,
    });
  }
};

/**
 * @desc    Save a sheet to the logged-in user's workspace
 *          This inserts the sheetId + userId into the `workspace` table
 *
 * @route   POST /api/sheets/save
 * @access  Private
 */
export const saveSheetToWorkspace = async (req, res) => {
  const { sheetId } = req.body;
  const userId = req.user.id; // assuming `protect` middleware sets req.user

  if (!sheetId) {
    return res.status(400).json({ message: "Sheet ID is required" });
  }

  try {
    const { data, error } = await supabase
      .from("workspace")
      .insert([{ user_id: userId, sheet_id: sheetId }]);

    if (error) throw error;

    res.status(201).json({ message: "Sheet saved to workspace", data });
  } catch (error) {
    console.error("Error saving sheet:", error.message);
    res.status(500).json({
      message: "Failed to save sheet",
      error: error.message,
    });
  }
};
