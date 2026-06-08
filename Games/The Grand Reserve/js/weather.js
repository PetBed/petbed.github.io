export const WEATHER_DATA = {
    sunny: {
        name: "Sunny",
        icon: "sun",
        color: "text-yellow-500",
        modifier: { sw: 20, ac: -10, tn: 0, bd: 0 }
    },
    rain: {
        name: "Rain",
        icon: "cloud-rain",
        color: "text-blue-500",
        modifier: { sw: -10, ac: 20, tn: 0, bd: 0 }
    },
    mist: {
        name: "Mist",
        icon: "cloud-fog",
        color: "text-gray-500",
        modifier: { sw: 0, ac: 0, tn: 0, bd: 10 }
    },
    temperate: {
        name: "Temperate",
        icon: "cloud",
        color: "text-gray-400",
        modifier: { sw: 0, ac: 0, tn: 0, bd: 0 }
    }
};
