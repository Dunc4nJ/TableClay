import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /store/address-autocomplete/details
 * Proxy endpoint for Google Places Details API (New)
 * Returns structured address components from a place_id
 *
 * Query Parameters:
 * - place_id (required): The Google Places place_id from autocomplete
 *
 * Response:
 * - address: Structured address components (street, city, state, postal_code, country)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { place_id } = req.query as { place_id?: string }

    // Validate place_id
    if (!place_id || typeof place_id !== "string") {
      return res.status(400).json({
        success: false,
        error: "place_id parameter is required",
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

    // Call Google Places Details API (New)
    // GET request with place_id in URL and fieldMask for specific fields
    const url = `https://places.googleapis.com/v1/places/${place_id}`
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "addressComponents,formattedAddress",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Google Places Details API error:", data.error?.message || response.statusText)
      return res.status(500).json({
        success: false,
        error: "Failed to fetch address details",
      })
    }

    // Extract address components from new API format
    const components = data.addressComponents || []
    const address = parseAddressComponents(components)
    address.formatted_address = data.formattedAddress || ""

    return res.json({
      success: true,
      address,
    })
  } catch (error) {
    console.error("Address details error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch address details",
    })
  }
}

/**
 * Parse Google address_components (New API format) into a structured address object
 * New API uses different field names: types[] -> types[], longText, shortText
 */
function parseAddressComponents(components: any[]): {
  street_number: string
  route: string
  address_1: string
  address_2: string
  city: string
  state: string
  postal_code: string
  country: string
  country_code: string
  formatted_address: string
} {
  const result = {
    street_number: "",
    route: "",
    address_1: "",
    address_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    country_code: "",
    formatted_address: "",
  }

  for (const component of components) {
    const types = component.types || []

    if (types.includes("street_number")) {
      result.street_number = component.longText || ""
    } else if (types.includes("route")) {
      result.route = component.longText || ""
    } else if (types.includes("subpremise")) {
      result.address_2 = component.longText || ""
    } else if (types.includes("locality")) {
      result.city = component.longText || ""
    } else if (types.includes("sublocality_level_1") && !result.city) {
      // Fallback for cities like New York that use sublocality
      result.city = component.longText || ""
    } else if (types.includes("administrative_area_level_1")) {
      result.state = component.shortText || "" // Use abbreviation for US states
    } else if (types.includes("postal_code")) {
      result.postal_code = component.longText || ""
    } else if (types.includes("country")) {
      result.country = component.longText || ""
      result.country_code = component.shortText?.toLowerCase() || ""
    }
  }

  // Combine street number and route into address_1
  if (result.street_number && result.route) {
    result.address_1 = `${result.street_number} ${result.route}`
  } else if (result.route) {
    result.address_1 = result.route
  } else if (result.street_number) {
    result.address_1 = result.street_number
  }

  return result
}
