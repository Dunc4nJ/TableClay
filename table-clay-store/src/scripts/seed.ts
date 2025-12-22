import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[];
    store_id: string;
  }) => {
    const normalizedInput = transform({ input }, (data) => {
      return {
        selector: { id: data.input.store_id },
        update: {
          supported_currencies: data.input.supported_currencies.map(
            (currency) => {
              return {
                currency_code: currency.currency_code,
                is_default: currency.is_default ?? false,
              };
            }
          ),
        },
      };
    });

    const stores = updateStoresStep(normalizedInput);

    return new WorkflowResponse(stores);
  }
);

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  const countries = ["us"];

  logger.info("Seeding Table Clay store data...");
  const [store] = await storeModuleService.listStores();

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        name: "Table Clay",
      },
    },
  });

  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [
          {
            name: "Default Sales Channel",
          },
        ],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  // USD only
  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [
        { currency_code: "usd", is_default: true },
      ],
    },
  });

  logger.info("Seeding region data...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "United States",
          currency_code: "usd",
          countries,
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const usRegion = regionResult[0];

  await createTaxRegionsWorkflow(container).run({
    input: [
      {
        country_code: "us",
      },
    ],
  });
  logger.info("Finished seeding regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Table Clay Studio",
          address: {
            city: "Portland",
            country_code: "US",
            address_1: "",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  const fulfillmentSetResult =
    await fulfillmentModuleService.createFulfillmentSets({
      name: "Table Clay Shipping",
      type: "shipping",
      service_zones: [
        {
          name: "US Shipping",
          geo_zones: [{ country_code: "us", type: "country" }],
        },
      ],
    });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSetResult.id,
    },
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;

  if (!shippingProfile) {
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [
            {
              name: "Default Shipping Profile",
              type: "default",
            },
          ],
        },
      });
    shippingProfile = shippingProfileResult[0];
  }

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSetResult.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Ships in 5-7 business days",
          code: "standard",
        },
        prices: [
          { currency_code: "usd", amount: 800 },
          { region_id: usRegion.id, amount: 800 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
    ],
  });
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding publishable API key data...");
  const { result: publishableApiKeyResult } = await createApiKeysWorkflow(
    container
  ).run({
    input: {
      api_keys: [
        {
          title: "Table Clay Storefront",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });
  const publishableApiKey = publishableApiKeyResult[0];

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding publishable API key data.");

  logger.info("Seeding product data...");

  // Create Mugs category
  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Mugs",
          is_active: true,
        },
      ],
    },
  });

  // CloudLine Mug - $34.99
  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "CloudLine Mug & Saucer Set",
          category_ids: [categoryResult[0].id],
          description:
            "Our signature CloudLine collection features a dreamy cloud pattern that brings a touch of whimsy to your morning routine. Each mug is hand-finished with organic, cloud-like shapes in a food-safe glaze, paired with a matching saucer. Due to the handmade nature, slight variations make each piece unique.",
          handle: "cloudline-mug",
          weight: 450,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://tableclay-images.s3.us-east-1.amazonaws.com/products/cloudline-mug/blue/hero.png" },
            { url: "https://tableclay-images.s3.us-east-1.amazonaws.com/products/cloudline-mug/blue/angle-1.png" },
            { url: "https://tableclay-images.s3.us-east-1.amazonaws.com/products/cloudline-mug/blue/angle-2.png" },
            { url: "https://tableclay-images.s3.us-east-1.amazonaws.com/products/cloudline-mug/blue/angle-3.png" },
            { url: "https://tableclay-images.s3.us-east-1.amazonaws.com/products/cloudline-mug/blue/angle-4.png" },
            { url: "https://tableclay-images.s3.us-east-1.amazonaws.com/products/cloudline-mug/blue/angle-5.png" },
            { url: "https://tableclay-images.s3.us-east-1.amazonaws.com/products/cloudline-mug/blue/angle-6.png" },
          ],
          options: [
            {
              title: "Color",
              values: ["Sky Blue", "Sunset Pink"],
            },
          ],
          variants: [
            {
              title: "Sky Blue",
              sku: "CLOUD-MUG-BLUE",
              options: { Color: "Sky Blue" },
              prices: [
                { amount: 3499, currency_code: "usd" },
              ],
            },
            {
              title: "Sunset Pink",
              sku: "CLOUD-MUG-PINK",
              options: { Color: "Sunset Pink" },
              prices: [
                { amount: 3499, currency_code: "usd" },
              ],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
      ],
    },
  });

  logger.info("Finished seeding products.");

  // Create inventory levels
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  const inventoryLevels: CreateInventoryLevelInput[] = [];
  for (const inventoryItem of inventoryItems) {
    inventoryLevels.push({
      location_id: stockLocation.id,
      inventory_item_id: inventoryItem.id,
      stocked_quantity: 100,
    });
  }

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryLevels,
    },
  });

  logger.info("Finished seeding inventory levels.");

  logger.info("Table Clay seeding complete!");
  logger.info(`Publishable API Key: ${publishableApiKey.token}`);
}
