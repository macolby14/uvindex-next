import { useEffect, useRef, useState } from "react";
import { format as formatDate } from "date-fns";
import {
  CartesianGrid,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  ResponsiveContainer,
} from "recharts";
import { fetchUvData, IUVData, parseRawUvData } from "./UVIndexChart.helper";
import { EditableText } from "@/components/EditableText";

const MINUTE_IN_MILLISECONDS = 60 * 1000;
const HOUR_IN_MILLISECONDS = MINUTE_IN_MILLISECONDS * 60;
const DAY_IN_MILLISECONDS = HOUR_IN_MILLISECONDS * 24;

// if it has been more than 24 hours since the last fetch or if it is apprxomiately 4am local time, fetch new data
function shouldFetchNewData(lastFetchTimestamp: number): boolean {
  const now = new Date();
  const lastFetchDate = new Date(lastFetchTimestamp);
  const hoursSinceLastFetch =
    (now.getTime() - lastFetchDate.getTime()) / HOUR_IN_MILLISECONDS;
  return hoursSinceLastFetch > 24 || now.getHours() === 4;
}

interface ISunsetResponse {
  sunsetTime: string;
}

async function fetchSunsetTime(zipCode: string): Promise<Date | null> {
  const sunsetDate = await fetch(`/api/sunset?zipcode=${zipCode}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch sunset time");
      }
      return response.json() as Promise<ISunsetResponse>;
    })
    .then((data) => new Date(data.sunsetTime))
    .catch(() => null);
  return sunsetDate;
}

const DEFAULT_ZIP_CODE = "10065";

export function UVIndexChart() {
  const [zipCode, setZipCode] = useState(DEFAULT_ZIP_CODE);
  const [sunsetTime, setSunsetTime] = useState<Date | null>(null);
  const [uvData, setUvData] = useState<IUVData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTimestamp, setCurrentTimestamp] = useState(
    new Date().getTime()
  );

  const earliestTimestamp =
    uvData.length > 0 ? uvData[0].dateTime : new Date().getTime();

  const lastDataUpdateTimestamp = useRef(0);

  const nextDayTimestamp = new Date(
    earliestTimestamp + DAY_IN_MILLISECONDS
  ).setHours(0, 0, 0, 0);

  /**
   * Load data if the current data is outdated
   */
  const loadDataIfNeeded = async () => {
    if (shouldFetchNewData(lastDataUpdateTimestamp.current)) {
      setLoading(true);
      const rawData = await fetchUvData();
      setLoading(false);
      if (rawData !== null) {
        lastDataUpdateTimestamp.current = new Date().getTime();
        const formattedData = parseRawUvData(rawData);
        setUvData(formattedData);
      }
    }
  };

  /**
   * Load sunsetTime initially and whenever the zipcode changes
   */
  useEffect(() => {
    fetchSunsetTime(zipCode).then((sunsetTime) => {
      setSunsetTime(sunsetTime);
    });
  }, [zipCode]);

  /**
   * Update the current timestamp every minute
   * Load data initially and then once an hour
   */
  useEffect(() => {
    const updateCurrentTimeInterval = setInterval(() => {
      setCurrentTimestamp(new Date().getTime());
    }, MINUTE_IN_MILLISECONDS);

    // check if we need to load data initially and then once an hour
    loadDataIfNeeded();
    const updateDataInterval = setInterval(
      loadDataIfNeeded,
      HOUR_IN_MILLISECONDS
    );

    return () => {
      clearInterval(updateCurrentTimeInterval);
      clearInterval(updateDataInterval);
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="p-6 space-y-1.5 font-semibold text-slate-600">
        <p className="space-y-1.5 font-semibold text-slate-600">
          UV Index for {formatDate(new Date(earliestTimestamp), "MMMM d")}
        </p>
        <div className="flex flex-row gap-1">
          <p>Zip Code:</p>
          <EditableText
            initialText={zipCode}
            onTextChange={(newZipCode) => {
              setZipCode(newZipCode);
            }}
          />
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64">Loading...</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={uvData}
            margin={{ top: 5, right: 5, left: -30, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              domain={uvData.map((data) => data.dateTime)}
              type="number"
              scale="time"
              dataKey="dateTime"
              tickFormatter={(datetime) =>
                `${new Date(datetime).getHours()}:00`
              }
            />
            <YAxis domain={[0, 11]} interval={0} ticks={[0, 3, 6, 8, 11]} />
            <Tooltip
              labelFormatter={(datetime) =>
                `Time: ${new Date(datetime).getHours()}:00`
              }
              formatter={(value) => [`UV Index: ${value}`]}
            />
            <Line dataKey="uvValue" type="monotone" stroke="#8884d8" />
            <ReferenceLine
              x={currentTimestamp}
              stroke="red"
              label={{ value: "Now", position: "insideTop" }}
            />
            <ReferenceLine
              x={nextDayTimestamp}
              stroke="lightblue"
              label={{
                position: "insideTop",
                value: formatDate(new Date(nextDayTimestamp), "MMM d"),
              }}
            />
            <ReferenceLine
              y={3}
              stroke="lightgrey"
              label={{ value: "Moderate", position: "insideLeft" }}
              position="start"
            />
            <ReferenceLine
              y={6}
              stroke="lightgrey"
              label={{ value: "High", position: "insideLeft" }}
              position="start"
            />
            <ReferenceLine
              y={8}
              stroke="lightgrey"
              label={{ value: "Very High", position: "insideLeft" }}
              position="start"
            />
            <ReferenceLine
              y={11}
              stroke="lightgrey"
              label={{ value: "Extreme", position: "insideLeft" }}
              position="start"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
