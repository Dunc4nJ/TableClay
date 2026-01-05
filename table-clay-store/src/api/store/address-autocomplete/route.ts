import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /store/address-autocomplete
 * Proxy endpoint for Google Places Autocomplete API (New)
 *
 * Query Parameters:
 * - input (required): The address search input (min 3 characters)
 *
 * Response:
 * - suggestions: Array of address suggestions with place_id and description
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { input } = req.query as { input?: string }

    // Validate input
    if (!input || typeof input !== "string") {
      return res.status(400).json({
        success: false,
        error: "Input parameter is required",
      })
    }

    if (input.length < 3) {
      return res.status(400).json({
        success: false,
        error: "Input must be at least 3 characters",
      })
    }

    // Check for API key
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      console.error("GOOGLE_PLACES_API_KEY not configured")
      return res.status(500).json({
        success: false,
        error: "Address autocomplete service not configured",
      })
    }

    // Call Google Places Autocomplete API (New)
    // Uses POST with JSON body and API key in header
    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify({
        input,
        includedPrimaryTypes: ["street_address", "premise", "subpremise", "route"],
        includedRegionCodes: ["us"], // Restrict to US addresses
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Google Places API error:", data.error?.message || response.statusText)
      return res.status(500).json({
        success: false,
        error: "Failed to fetch address suggestions",
      })
    }

    // Transform response to simpler format
    // New API returns suggestions[].placePrediction
    const suggestions = (data.suggestions || [])
      .filter((s: any) => s.placePrediction) // Only place predictions, not query predictions
      .map((s: any) => ({
        place_id: s.placePrediction.placeId,
        description: s.placePrediction.text?.text || "",
        structured: {
          main_text: s.placePrediction.structuredFormat?.mainText?.text || "",
          secondary_text: s.placePrediction.structuredFormat?.secondaryText?.text || "",
        },
      }))

    return res.json({
      success: true,
      suggestions,
    })
  } catch (error) {
    console.error("Address autocomplete error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch address suggestions",
    })
  }
}
