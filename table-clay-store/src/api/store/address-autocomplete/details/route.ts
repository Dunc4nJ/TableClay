import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /store/address-autocomplete/details
 * Proxy endpoint for Google Places Details API
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

    // Call Google Places Details API
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json")
    url.searchParams.set("place_id", place_id)
    url.searchParams.set("fields", "address_components,formatted_address")
    url.searchParams.set("key", apiKey)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== "OK") {
      console.error("Google Places Details API error:", data.status, data.error_message)
      return res.status(500).json({
        success: false,
        error: "Failed to fetch address details",
      })
    }

    // Extract address components
    const components = data.result?.address_components || []
    const address = parseAddressComponents(components)
    address.formatted_address = data.result?.formatted_address || ""

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
 * Parse Google address_components into a structured address object
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
      result.street_number = component.long_name
    } else if (types.includes("route")) {
      result.route = component.long_name
    } else if (types.includes("subpremise")) {
      result.address_2 = component.long_name
    } else if (types.includes("locality")) {
      result.city = component.long_name
    } else if (types.includes("sublocality_level_1") && !result.city) {
      // Fallback for cities like New York that use sublocality
      result.city = component.long_name
    } else if (types.includes("administrative_area_level_1")) {
      result.state = component.short_name // Use abbreviation for US states
    } else if (types.includes("postal_code")) {
      result.postal_code = component.long_name
    } else if (types.includes("country")) {
      result.country = component.long_name
      result.country_code = component.short_name?.toLowerCase() || ""
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
