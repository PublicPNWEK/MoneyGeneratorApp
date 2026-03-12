import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import { Models } from '../models.js';

// Initialize storage
if (!Models.plugins) Models.plugins = new Map();
if (!Models.installedPlugins) Models.installedPlugins = new Map();
if (!Models.developers) Models.developers = new Map();
if (!Models.whiteLabelConfigs) Models.whiteLabelConfigs = new Map();
if (!Models.pluginWebhooks) Models.pluginWebhooks = new Map();

// Plugin categories
const PLUGIN_CATEGORIES = [
  'earnings_tracking',
  'expense_management',
  'tax_preparation',
  'banking',
  'analytics',
  'scheduling',
  'route_optimization',
  'communications',
  'accounting',
  'insurance',
];

export const MarketplaceService = {
  // Register as developer
  registerDeveloper: ({ userId, companyName, website, contactEmail }) => {
    const developer = {
      id: uuid(),
      userId,
      companyName,
      website,
      contactEmail,
      status: 'pending_review',
      apiKey: crypto.randomBytes(32).toString('hex'),
      createdAt: new Date().toISOString(),
      publishedPlugins: [],
    };

    Models.developers.set(developer.id, developer);
    Models.auditLog.push({ type: 'developer_registered', developerId: developer.id });

    return {
      developerId: developer.id,
      status: developer.status,
      message: 'Your developer account is pending review',
    };
  },

  // Create plugin listing
  createPlugin: ({
    developerId,
    name,
    description,
    category,
    version,
    pricing,
    permissions,
    webhookUrl,
    iconUrl,
    screenshots,
  }) => {
    const developer = Models.developers.get(developerId);
    if (!developer || developer.status !== 'approved') {
      throw new Error('developer_not_approved');
    }

    if (!PLUGIN_CATEGORIES.includes(category)) {
      throw new Error('invalid_category');
    }

    const plugin = {
      id: uuid(),
      developerId,
      developerName: developer.companyName,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description,
      category,
      version,
      pricing: pricing || { type: 'free', price: 0 },
      permissions: permissions || [],
      webhookUrl,
      iconUrl,
      screenshots: screenshots || [],
      status: 'pending_review',
      rating: 0,
      reviewCount: 0,
      installCount: 0,
      createdAt: new Date().toISOString(),
      publishedAt: null,
    };

    Models.plugins.set(plugin.id, plugin);
    developer.publishedPlugins.push(plugin.id);
    Models.auditLog.push({ type: 'plugin_created', pluginId: plugin.id, developerId });

    return plugin;
  },

  // List marketplace plugins
  listPlugins: ({ category, search, sort = 'popular', page = 1, limit = 20 }) => {
    let plugins = Array.from(Models.plugins.values())
      .filter(p => p.status === 'published');

    if (category) {
      plugins = plugins.filter(p => p.category === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      plugins = plugins.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    switch (sort) {
      case 'popular':
        plugins.sort((a, b) => b.installCount - a.installCount);
        break;
      case 'rating':
        plugins.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        plugins.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        break;
      case 'name':
        plugins.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    const start = (page - 1) * limit;
    const paginated = plugins.slice(start, start + limit);

    return {
      plugins: paginated,
      total: plugins.length,
      page,
      totalPages: Math.ceil(plugins.length / limit),
      categories: PLUGIN_CATEGORIES,
    };
  },

  // Get plugin details
  getPlugin: ({ pluginId }) => {
    const plugin = Models.plugins.get(pluginId);
    if (!plugin) throw new Error('plugin_not_found');

    return plugin;
  },

  // Install plugin
  installPlugin: ({ userId, pluginId }) => {
    const plugin = Models.plugins.get(pluginId);
    if (!plugin || plugin.status !== 'published') {
      throw new Error('plugin_not_available');
    }

    const userPlugins = Models.installedPlugins.get(userId) || [];
    if (userPlugins.find(p => p.pluginId === pluginId)) {
      throw new Error('plugin_already_installed');
    }

    const installation = {
      id: uuid(),
      userId,
      pluginId,
      pluginName: plugin.name,
      version: plugin.version,
      installedAt: new Date().toISOString(),
      settings: {},
      status: 'active',
    };

    userPlugins.push(installation);
    Models.installedPlugins.set(userId, userPlugins);
    plugin.installCount++;
    Models.metrics.increment('marketplace.installs');

    // Notify plugin webhook
    if (plugin.webhookUrl) {
      MarketplaceService.notifyPlugin({
        webhookUrl: plugin.webhookUrl,
        event: 'install',
        data: { userId, installationId: installation.id },
      });
    }

    return installation;
  },

  // Uninstall plugin
  uninstallPlugin: ({ userId, pluginId }) => {
    const userPlugins = Models.installedPlugins.get(userId) || [];
    const index = userPlugins.findIndex(p => p.pluginId === pluginId);
    
    if (index === -1) {
      throw new Error('plugin_not_installed');
    }

    const installation = userPlugins.splice(index, 1)[0];
    Models.installedPlugins.set(userId, userPlugins);

    const plugin = Models.plugins.get(pluginId);
    if (plugin) {
      plugin.installCount = Math.max(0, plugin.installCount - 1);
      
      if (plugin.webhookUrl) {
        MarketplaceService.notifyPlugin({
          webhookUrl: plugin.webhookUrl,
          event: 'uninstall',
          data: { userId, installationId: installation.id },
        });
      }
    }

    return { uninstalled: true };
  },

  // Get user's installed plugins
  getInstalledPlugins: ({ userId }) => {
    const installations = Models.installedPlugins.get(userId) || [];
    
    return {
      plugins: installations.map(inst => {
        const plugin = Models.plugins.get(inst.pluginId);
        return {
          ...inst,
          plugin: plugin ? {
            name: plugin.name,
            description: plugin.description,
            iconUrl: plugin.iconUrl,
            version: plugin.version,
          } : null,
        };
      }),
    };
  },

  // Update plugin settings
  updatePluginSettings: ({ userId, pluginId, settings }) => {
    const userPlugins = Models.installedPlugins.get(userId) || [];
    const installation = userPlugins.find(p => p.pluginId === pluginId);
    
    if (!installation) {
      throw new Error('plugin_not_installed');
    }

    installation.settings = { ...installation.settings, ...settings };
    installation.updatedAt = new Date().toISOString();

    return installation;
  },

  // Notify plugin webhook
  notifyPlugin: async ({ webhookUrl, event, data }) => {
    // In production, this would make actual HTTP requests
    console.log(`[Marketplace] Would notify ${webhookUrl}: ${event}`);
    
    const notification = {
      id: uuid(),
      webhookUrl,
      event,
      data,
      sentAt: new Date().toISOString(),
      status: 'simulated',
    };

    const webhooks = Models.pluginWebhooks.get(webhookUrl) || [];
    webhooks.push(notification);
    Models.pluginWebhooks.set(webhookUrl, webhooks);

    return notification;
  },

  // Rate plugin
  ratePlugin: ({ userId, pluginId, rating, review }) => {
    const plugin = Models.plugins.get(pluginId);
    if (!plugin) throw new Error('plugin_not_found');

    if (rating < 1 || rating > 5) {
      throw new Error('invalid_rating');
    }

    // Simple rating update (in production, would track individual reviews)
    const newCount = plugin.reviewCount + 1;
    plugin.rating = ((plugin.rating * plugin.reviewCount) + rating) / newCount;
    plugin.reviewCount = newCount;

    Models.auditLog.push({ type: 'plugin_rated', pluginId, userId, rating });

    return {
      pluginId,
      newRating: Math.round(plugin.rating * 10) / 10,
      reviewCount: plugin.reviewCount,
    };
  },

  // White-label configuration
  createWhiteLabelConfig: ({
    partnerId,
    brandName,
    logoUrl,
    primaryColor,
    secondaryColor,
    customDomain,
    features,
    apiAccess,
  }) => {
    const config = {
      id: uuid(),
      partnerId,
      brandName,
      logoUrl,
      colors: {
        primary: primaryColor || '#4F46E5',
        secondary: secondaryColor || '#10B981',
      },
      customDomain,
      features: features || ['all'],
      apiAccess: apiAccess || 'standard',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    Models.whiteLabelConfigs.set(partnerId, config);
    Models.auditLog.push({ type: 'whitelabel_created', partnerId });

    return config;
  },

  // Get white-label config
  getWhiteLabelConfig: ({ partnerId, customDomain }) => {
    if (partnerId) {
      return Models.whiteLabelConfigs.get(partnerId) || null;
    }

    if (customDomain) {
      for (const config of Models.whiteLabelConfigs.values()) {
        if (config.customDomain === customDomain) {
          return config;
        }
      }
    }

    return null;
  },

  // Update white-label config
  updateWhiteLabelConfig: ({ partnerId, updates }) => {
    const config = Models.whiteLabelConfigs.get(partnerId);
    if (!config) throw new Error('config_not_found');

    const allowed = ['brandName', 'logoUrl', 'colors', 'customDomain', 'features'];
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        config[key] = updates[key];
      }
    }
    config.updatedAt = new Date().toISOString();

    return config;
  },

  // Admin: Approve developer
  approveDeveloper: ({ developerId, reviewerId }) => {
    const developer = Models.developers.get(developerId);
    if (!developer) throw new Error('developer_not_found');

    developer.status = 'approved';
    developer.approvedAt = new Date().toISOString();
    developer.approvedBy = reviewerId;

    Models.auditLog.push({ type: 'developer_approved', developerId, reviewerId });

    return developer;
  },

  // Admin: Publish plugin
  publishPlugin: ({ pluginId, reviewerId }) => {
    const plugin = Models.plugins.get(pluginId);
    if (!plugin) throw new Error('plugin_not_found');

    plugin.status = 'published';
    plugin.publishedAt = new Date().toISOString();
    plugin.publishedBy = reviewerId;

    Models.auditLog.push({ type: 'plugin_published', pluginId, reviewerId });

    return plugin;
  },

  // Get marketplace stats
  getMarketplaceStats: () => {
    const plugins = Array.from(Models.plugins.values());
    const developers = Array.from(Models.developers.values());

    return {
      totalPlugins: plugins.filter(p => p.status === 'published').length,
      totalDevelopers: developers.filter(d => d.status === 'approved').length,
      totalInstalls: plugins.reduce((sum, p) => sum + p.installCount, 0),
      byCategory: PLUGIN_CATEGORIES.map(cat => ({
        category: cat,
        count: plugins.filter(p => p.category === cat && p.status === 'published').length,
      })),
      topPlugins: plugins
        .filter(p => p.status === 'published')
        .sort((a, b) => b.installCount - a.installCount)
        .slice(0, 5)
        .map(p => ({ id: p.id, name: p.name, installs: p.installCount })),
    };
  },
};
