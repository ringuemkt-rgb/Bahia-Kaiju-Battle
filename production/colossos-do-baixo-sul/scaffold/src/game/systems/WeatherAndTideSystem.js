export class WeatherAndTideSystem {
  constructor(scene) {
    this.scene = scene;
    this.weather = 'sun';
    this.tide = 'mid_tide';
  }

  setWeather(nextWeather) {
    this.weather = nextWeather;
    return this.weather;
  }

  setTide(nextTide) {
    this.tide = nextTide;
    return this.tide;
  }

  getModifiers() {
    return {
      weather: this.weather,
      tide: this.tide,
      visibilityPenalty: ['fog', 'tropical_rain', 'atl_mist'].includes(this.weather),
      flyingInstability: ['strong_wind', 'electric_storm'].includes(this.weather),
      shorelineFlooded: ['high_tide', 'storm_surge'].includes(this.tide)
    };
  }
}
