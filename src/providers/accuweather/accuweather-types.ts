export interface AccuWeatherTemperatureValue {
  Value: number;
  Unit: string;
  UnitType: number;
}

export interface AccuWeatherHalfDay {
  Icon: number;
  IconPhrase: string;
  HasPrecipitation: boolean;
  PrecipitationType?: string;
  PrecipitationIntensity?: string;
}

export interface AccuWeatherDailyForecast {
  Date: string;
  Temperature: {
    Minimum: AccuWeatherTemperatureValue;
    Maximum: AccuWeatherTemperatureValue;
  };
  Day: AccuWeatherHalfDay;
  Night: AccuWeatherHalfDay;
  MobileLink?: string;
  Link?: string;
}

export interface AccuWeatherDailyResponse {
  DailyForecasts: AccuWeatherDailyForecast[];
}
