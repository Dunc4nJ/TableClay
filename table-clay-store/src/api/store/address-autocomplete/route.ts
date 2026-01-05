import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /store/address-autocomplete
 * Proxy endpoint for Google Places Autocomplete API
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

    // Call Google Places Autocomplete API
    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json")
    url.searchParams.set("input", input)
    url.searchParams.set("types", "address")
    url.searchParams.set("components", "country:us") // Restrict to US addresses
    url.searchParams.set("key", apiKey)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places API error:", data.status, data.error_message)
      return res.status(500).json({
        success: false,
        error: "Failed to fetch address suggestions",
      })
    }

    // Transform response to simpler format
    const suggestions = (data.predictions || []).map((prediction: any) => ({
      place_id: prediction.place_id,
      description: prediction.description,
      structured: {
        main_text: prediction.structured_formatting?.main_text || "",
        secondary_text: prediction.structured_formatting?.secondary_text || "",
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
