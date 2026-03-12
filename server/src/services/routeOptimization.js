import { v4 as uuid } from 'uuid';
import { Models } from '../models.js';

// Initialize storage
if (!Models.surgeZones) Models.surgeZones = new Map();
if (!Models.routeHistory) Models.routeHistory = new Map();
if (!Models.heatmapData) Models.heatmapData = new Map();
if (!Models.locationHistory) Models.locationHistory = new Map();

// Surge multiplier thresholds
const SURGE_LEVELS = {
  LOW: { min: 1.0, max: 1.25, label: 'Normal' },
  MEDIUM: { min: 1.25, max: 1.75, label: 'Busy' },
  HIGH: { min: 1.75, max: 2.5, label: 'Surge' },
  EXTREME: { min: 2.5, max: 5.0, label: 'Peak Surge' },
};

export const RouteOptimizationService = {
  // Record a surge zone (typically from platform data or observation)
  recordSurgeZone: ({ platform, area, multiplier, coordinates, expiresAt }) => {
    const zone = {
      id: uuid(),
      platform,
      area,
      multiplier,
      coordinates: coordinates || null, // { lat, lng, radius }
      level: getSurgeLevel(multiplier),
      recordedAt: new Date().toISOString(),
      expiresAt: expiresAt || new Date(Date.now() + 30 * 60000).toISOString(), // 30 min default
      isActive: true,
    };

    Models.surgeZones.set(zone.id, zone);
    Models.metrics.increment('routes.surge_zones_recorded');
    return zone;
  },

  // Get active surge zones
  getActiveSurgeZones: ({ platform, coordinates, radiusMiles }) => {
    const now = new Date().toISOString();
    let zones = Array.from(Models.surgeZones.values())
      .filter(z => z.isActive && z.expiresAt > now);

    if (platform) {
      zones = zones.filter(z => z.platform === platform);
    }

    // If coordinates provided, filter by distance
    if (coordinates && radiusMiles) {
      zones = zones.filter(z => {
        if (!z.coordinates) return true; // Include zones without coordinates
        const distance = calculateDistance(
          coordinates.lat, coordinates.lng,
          z.coordinates.lat, z.coordinates.lng
        );
        return distance <= radiusMiles;
      });
    }

    // Sort by multiplier descending
    zones.sort((a, b) => b.multiplier - a.multiplier);

    return {
      zones,
      count: zones.length,
      highestMultiplier: zones.length > 0 ? zones[0].multiplier : 1.0,
    };
  },

  // Optimize a route for multiple stops
  optimizeRoute: ({ userId, stops, optimizeFor = 'distance', avoidHighways = false }) => {
    // Simple route optimization using nearest neighbor algorithm
    // In production, would use Google Maps / OSRM / HERE APIs
    if (stops.length <= 2) {
      return { 
        optimizedStops: stops, 
        totalDistance: 0, 
        estimatedMinutes: 0,
        savings: { distanceMiles: 0, timeMinutes: 0 },
      };
    }

    const optimized = nearestNeighborOptimize(stops);
    const originalDistance = calculateTotalDistance(stops);
    const optimizedDistance = calculateTotalDistance(optimized);
    const distanceSaved = Math.max(0, originalDistance - optimizedDistance);

    const route = {
      id: uuid(),
      userId,
      originalStops: stops,
      optimizedStops: optimized,
      totalDistanceMiles: Math.round(optimizedDistance * 100) / 100,
      estimatedMinutes: Math.round(optimizedDistance * 3), // ~3 min per mile avg
      optimizeFor,
      avoidHighways,
      savings: {
        distanceMiles: Math.round(distanceSaved * 100) / 100,
        timeMinutes: Math.round(distanceSaved * 3),
        fuelEstimate: Math.round(distanceSaved * 0.15 * 100) / 100, // ~$0.15/mile
      },
      createdAt: new Date().toISOString(),
    };

    Models.routeHistory.set(route.id, route);
    Models.metrics.increment('routes.optimized');

    return route;
  },

  // Get earnings heatmap data
  getEarningsHeatmap: ({ userId, platform, startDate, endDate, gridSize = 'medium' }) => {
    // In production, aggregate shift earnings by location
    // For now, return cached/simulated heatmap
    const cacheKey = `${userId}-${platform || 'all'}-${startDate}-${endDate}`;
    
    if (Models.heatmapData.has(cacheKey)) {
      return Models.heatmapData.get(cacheKey);
    }

    // Generate heatmap from shift data
    const shifts = Array.from(Models.gigShifts?.values() || [])
      .filter(s => {
        if (s.userId !== userId) return false;
        if (platform && s.platform !== platform) return false;
        if (startDate && s.createdAt < startDate) return false;
        if (endDate && s.createdAt > endDate) return false;
        return true;
      });

    // Aggregate by area (simplified)
    const areaStats = {};
    for (const shift of shifts) {
      const area = shift.metadata?.area || 'Unknown';
      if (!areaStats[area]) {
        areaStats[area] = { 
          totalEarnings: 0, 
          shifts: 0, 
          totalHours: 0,
          avgHourlyRate: 0,
        };
      }
      areaStats[area].totalEarnings += shift.earnings || 0;
      areaStats[area].shifts += 1;
      areaStats[area].totalHours += (shift.durationMinutes || 0) / 60;
    }

    // Calculate hourly rates
    for (const area of Object.keys(areaStats)) {
      const stats = areaStats[area];
      stats.avgHourlyRate = stats.totalHours > 0 
        ? Math.round(stats.totalEarnings / stats.totalHours * 100) / 100
        : 0;
    }

    const heatmap = {
      userId,
      platform,
      period: { startDate, endDate },
      gridSize,
      areas: Object.entries(areaStats).map(([area, stats]) => ({
        area,
        ...stats,
        intensity: getHeatmapIntensity(stats.avgHourlyRate),
      })),
      generatedAt: new Date().toISOString(),
    };

    Models.heatmapData.set(cacheKey, heatmap);
    return heatmap;
  },

  // Suggest best times to work
  suggestBestTimes: ({ userId, platform, dayOfWeek }) => {
    // Analyze historical shift data to suggest optimal work times
    const shifts = Array.from(Models.gigShifts?.values() || [])
      .filter(s => {
        if (s.userId !== userId) return false;
        if (platform && s.platform !== platform) return false;
        return s.hourlyRate && s.hourlyRate > 0;
      });

    // Group by hour of day
    const hourlyStats = {};
    for (let h = 0; h < 24; h++) {
      hourlyStats[h] = { totalEarnings: 0, totalHours: 0, shifts: 0 };
    }

    for (const shift of shifts) {
      const hour = new Date(shift.startTime).getHours();
      hourlyStats[hour].totalEarnings += shift.earnings || 0;
      hourlyStats[hour].totalHours += (shift.durationMinutes || 0) / 60;
      hourlyStats[hour].shifts += 1;
    }

    // Calculate hourly rates and rank
    const suggestions = Object.entries(hourlyStats)
      .map(([hour, stats]) => ({
        hour: parseInt(hour),
        avgHourlyRate: stats.totalHours > 0 
          ? Math.round(stats.totalEarnings / stats.totalHours * 100) / 100
          : 0,
        shiftsAnalyzed: stats.shifts,
        confidence: getConfidenceLevel(stats.shifts),
      }))
      .filter(s => s.shiftsAnalyzed > 0)
      .sort((a, b) => b.avgHourlyRate - a.avgHourlyRate);

    return {
      userId,
      platform,
      dayOfWeek,
      bestHours: suggestions.slice(0, 5),
      worstHours: suggestions.slice(-3).reverse(),
      totalShiftsAnalyzed: shifts.length,
    };
  },

  // Track user location (for auto-mileage)
  recordLocation: ({ userId, latitude, longitude, accuracy, timestamp }) => {
    const location = {
      id: uuid(),
      userId,
      latitude,
      longitude,
      accuracy,
      timestamp: timestamp || new Date().toISOString(),
    };

    // Get or create location array for user
    const userLocations = Models.locationHistory.get(userId) || [];
    userLocations.push(location);
    
    // Keep only last 1000 locations per user
    if (userLocations.length > 1000) {
      userLocations.shift();
    }
    
    Models.locationHistory.set(userId, userLocations);
    return { recorded: true };
  },

  // Calculate trip distance from location history
  calculateTripDistance: ({ userId, startTime, endTime }) => {
    const locations = Models.locationHistory.get(userId) || [];
    
    const tripLocations = locations.filter(l => {
      const ts = new Date(l.timestamp);
      return ts >= new Date(startTime) && ts <= new Date(endTime);
    });

    if (tripLocations.length < 2) {
      return { distanceMiles: 0, locations: tripLocations.length };
    }

    let totalDistance = 0;
    for (let i = 1; i < tripLocations.length; i++) {
      totalDistance += calculateDistance(
        tripLocations[i - 1].latitude,
        tripLocations[i - 1].longitude,
        tripLocations[i].latitude,
        tripLocations[i].longitude
      );
    }

    return {
      distanceMiles: Math.round(totalDistance * 100) / 100,
      locations: tripLocations.length,
      startLocation: tripLocations[0],
      endLocation: tripLocations[tripLocations.length - 1],
    };
  },

  // Batch deliveries intelligently
  batchDeliveries: ({ deliveries, maxBatchSize = 3, maxDetourMiles = 2 }) => {
    if (deliveries.length <= 1) {
      return { batches: [deliveries], savings: { timeMins: 0, miles: 0 } };
    }

    // Simple batching algorithm based on proximity
    const batches = [];
    const assigned = new Set();
    
    for (const delivery of deliveries) {
      if (assigned.has(delivery.id)) continue;
      
      const batch = [delivery];
      assigned.add(delivery.id);
      
      // Find nearby deliveries
      for (const other of deliveries) {
        if (assigned.has(other.id)) continue;
        if (batch.length >= maxBatchSize) break;
        
        const distance = calculateDistance(
          delivery.dropoff.lat, delivery.dropoff.lng,
          other.dropoff.lat, other.dropoff.lng
        );
        
        if (distance <= maxDetourMiles) {
          batch.push(other);
          assigned.add(other.id);
        }
      }
      
      batches.push(batch);
    }

    // Calculate savings
    const originalTrips = deliveries.length;
    const batchedTrips = batches.length;
    const tripsSaved = originalTrips - batchedTrips;

    return {
      batches,
      batchCount: batches.length,
      originalDeliveries: deliveries.length,
      savings: {
        tripsSaved,
        estimatedTimeMins: tripsSaved * 15, // ~15 mins per separate trip
        estimatedMiles: tripsSaved * 3, // ~3 miles per separate trip
      },
    };
  },
};

// Helper functions
function getSurgeLevel(multiplier) {
  for (const [level, range] of Object.entries(SURGE_LEVELS)) {
    if (multiplier >= range.min && multiplier < range.max) {
      return { level, label: range.label };
    }
  }
  return { level: 'EXTREME', label: 'Peak Surge' };
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  // Haversine formula for distance in miles
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function nearestNeighborOptimize(stops) {
  if (stops.length <= 2) return stops;
  
  const optimized = [stops[0]];
  const remaining = stops.slice(1);
  
  while (remaining.length > 0) {
    const current = optimized[optimized.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;
    
    for (let i = 0; i < remaining.length; i++) {
      const dist = calculateDistance(
        current.lat, current.lng,
        remaining[i].lat, remaining[i].lng
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }
    
    optimized.push(remaining.splice(nearestIdx, 1)[0]);
  }
  
  return optimized;
}

function calculateTotalDistance(stops) {
  let total = 0;
  for (let i = 1; i < stops.length; i++) {
    total += calculateDistance(
      stops[i - 1].lat, stops[i - 1].lng,
      stops[i].lat, stops[i].lng
    );
  }
  return total;
}

function getHeatmapIntensity(hourlyRate) {
  if (hourlyRate >= 35) return 'hot';
  if (hourlyRate >= 25) return 'warm';
  if (hourlyRate >= 15) return 'neutral';
  return 'cool';
}

function getConfidenceLevel(shifts) {
  if (shifts >= 20) return 'high';
  if (shifts >= 10) return 'medium';
  if (shifts >= 5) return 'low';
  return 'insufficient';
}
