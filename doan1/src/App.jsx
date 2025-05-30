import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function App() {
  const [scrollIndices, setScrollIndices] = useState({});
  const viewWindowSize = 20;
  const [Temp, setTemp] = useState(null);
  const [Data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [Sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get(`${apiUrl}/session`);
        setSessions(response.data);
        setLoading(false);
      } catch (err) {
        setError("Không thể tải danh sách phiên");
        console.error("Lỗi khi gọi API:", err);
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);
  //xuat data dua tren selectedSession
  useEffect(() => {
    if (selectedSession !== null) {
      const fetchDataBySession = async () => {
        try {
          const response = await axios.get(`${apiUrl}/data/${selectedSession}`);
          setData(response.data);
        } catch (err) {
          setError("Không thể tải dữ liệu phiên");
          console.error("Lỗi khi gọi API:", err);
        }
      };

      fetchDataBySession();
    }
  }, [selectedSession]);

  //data moi nhat
  useEffect(() => {
    const fetchTemp = async () => {
      try {
        const latestTemp = await axios.get(`${apiUrl}/data/temperature/latest`);
        setTemp(latestTemp.data);
      } catch (err) {
        console.error("Lỗi khi tải nhiệt độ:", err);
      }
    };

    fetchTemp();
  }, []);

  // WebSocket
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log("WebSocket connected");

    ws.onmessage = async (event) => {
      if (event.data === "update" && selectedSession !== null) {
        try {
          const latestTemp = await axios.get(
            `${apiUrl}/data/temperature/latest`
          );
          const sessionData = await axios.get(
            `${apiUrl}/data/${selectedSession}`
          );
          setTemp(latestTemp.data);
          setData(sessionData.data);
        } catch (err) {
          console.error("WebSocket fetch error: ", err);
        }
      }
    };

    ws.onclose = () => console.log("WebSocket closed");
    return () => ws.close();
  }, [selectedSession]);

  if (loading)
    return (
      <div style={{ padding: "20px" }}>
        <div
          style={{
            height: "50px",
            background: "#2c3e50",
            borderRadius: "8px",
            margin: "30px 0 40px 110px",
            width: "300px",
            animation: "pulse 1.5s infinite",
          }}
        ></div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "40px",
            margin: "0 0 50px 110px",
          }}
        >
          <div
            style={{
              height: "30px",
              background: "#2c3e50",
              borderRadius: "6px",
              width: "300px",
              animation: "pulse 1.5s infinite",
            }}
          ></div>
        </div>

        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              height: "500px",
              background: "#2c3e50",
              borderRadius: "10px",
              margin: "0 0 70px 110px",
              animation: "pulse 1.5s infinite",
            }}
          ></div>
        ))}
      </div>
    );
  if (error) return <p>{error}</p>;

  const processData = (data) => {
    const processedData = [];
    for (let i = 0; i < data.length; i += 10) {
      processedData.push(data[i]);
    }
    if (data.length % 10 !== 0) {
      processedData.push(data[data.length - 1]);
    }
    return processedData;
  };

  const processedData = processData(Data);

  const gasCharts = [
    { key: "ppm_co", name: "CO", color: "#8884d8" },
    { key: "ppm_co2", name: "CO2", color: "#82ca9d" },
    { key: "ppm_nh3", name: "NH3", color: "#ff7300" },
    { key: "ppm_toluen", name: "Toluene", color: "#00bcd4" },
    { key: "ppm_c6h6", name: "C6H6 (Benzene)", color: "#9c27b0" },
  ];

  const renderHumidityChart = (humidity) => {
    const data = [
      { name: "Humidity", value: humidity },
      { name: "Remaining", value: 100 - humidity },
    ];

    const COLORS = ["#00acc1", "#e0e0e0"];

    return (
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h3 style={{ color: "#ffffff", marginLeft: "-15px", fontSize: "30px" }}>
          Độ ẩm
        </h3>
        <PieChart width={200} height={200}>
          <Pie
            data={data}
            innerRadius={70}
            outerRadius={90}
            startAngle={90}
            endAngle={450}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>
        <div
          style={{
            marginTop: "-125px",
            fontSize: "24px",
            fontWeight: "bold",
            color: "#00acc1",
          }}
        >
          {humidity}%
        </div>
      </div>
    );
  };

  const handleScrollChange = (key, value) => {
    setScrollIndices((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  ////////////////////////////////////////////////////

  return (
    <div style={{ padding: "20px" }}>
      {/* Dropdown chọn session */}
      <div
        style={{
          margin: "30px 0 40px 110px",
          display: "flex",
          alignItems: "center",
          gap: "30px",
        }}
      >
        <label
          style={{
            fontSize: "30px",
            fontWeight: "bold",
            whiteSpace: "nowrap",
          }}
        >
          Chọn phiên:
        </label>
        <select
          style={{
            border: "none",
            backgroundColor: "#2c3e50",
            color: "white",
            borderRadius: "6px",
            padding: "10px 15px",
            fontSize: "20px",
            minWidth: "250px",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          value={selectedSession || ""}
          onChange={(e) => setSelectedSession(Number(e.target.value))}
        >
          <option value="" disabled>
            -- Chọn phiên --
          </option>
          {Sessions.map((session) => (
            <option key={session.session_id} value={session.session_id}>
              {`Phiên ${session.session_id} - ${
                new Date(session.created_at).toISOString().split("T")[0]
              }`}
            </option>
          ))}
        </select>
      </div>
      {/* Thêm thông báo khi chưa chọn phiên */}
      {Data.length === 0 && !loading && (
        <div
          style={{
            textAlign: "center",
            color: "#ffffff",
            fontSize: "24px",
            margin: "50px 0",
            opacity: 0.7,
            marginLeft: "110px", // Thêm để đồng bộ với các phần khác
          }}
        >
          Vui lòng chọn phiên để xem dữ liệu
        </div>
      )}
      {/* Dữ liệu mới nhất */}
      {Data.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "40px",
            margin: "0 0 50px 110px",
          }}
        >
          <div
            style={{
              fontSize: "30px",
              color: "#ffffff",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "30px" }}>🌡️</span>
            Nhiệt độ: {Data[Data.length - 1].nhietdo.toFixed(1)} °C
          </div>
          {renderHumidityChart(Data[Data.length - 1].doam)}
        </div>
      )}

      <h2
        style={{
          textAlign: "center",
          color: "#ffffff",
          fontSize: "50px",
          marginTop: "80px",
          marginBottom: "40px",
          marginLeft: "110px",
        }}
      >
        Biểu đồ nồng độ khí theo thời gian
      </h2>

      {/* Biểu đồ khí */}
      <div
        style={{
          width: "100%",
          marginLeft: "110px",
          maxWidth: "calc(100% - 200px)",
        }}
      >
        {gasCharts.map(({ key, name, color }) => {
          const containerWidth = 1000;
          const spacingPerPoint = 50;
          const contentWidth = Math.max(
            processedData.length * spacingPerPoint,
            containerWidth
          );
          const scrollIndexForThisChart = scrollIndices[key] || 0;
          const visibleData = processedData.slice(
            scrollIndexForThisChart,
            scrollIndexForThisChart + viewWindowSize
          );
          return (
            <div
              key={key}
              style={{
                width: 2000,
                height: 500,
                marginBottom: 170,
                boxShadow: "0px 4px 20px rgba(44, 66, 100, 0.6)",
                borderRadius: "10px",
                padding: "20px",
                background: "#1c2a42",
                transition: "all 0.3s ease",
                transform: "translateY(0)",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 15px 35px rgba(44, 66, 100, 0.8)",
                },
              }}
            >
              <h3 style={{ fontSize: "30px", color: "#ffffff" }}>{name}</h3>
              <ResponsiveContainer>
                <LineChart
                  data={visibleData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid stroke="#ccc" strokeWidth={1} />
                  <XAxis
                    dataKey="created_at"
                    tick={{
                      style: {
                        fontWeight: 700,
                        fontSize: "18px",
                        fill: "#ffffff",
                      },
                    }}
                    tickFormatter={(value) => {
                      const timepart = value.split("T")[1];
                      const time = timepart?.split(".")[0];
                      return time.split(":")[0] + ":" + time.split(":")[1];
                    }}
                    label={{
                      value: "Thời gian",
                      position: "insideBottomRight",
                      offset: -22,
                      style: {
                        fontWeight: 700,
                        fontSize: "24px",
                        fill: "#ffffff",
                      },
                    }}
                  />

                  <YAxis
                    tick={{
                      style: {
                        fontWeight: 700,
                        fontSize: "18px",
                        fill: "#ffffff",
                      },
                    }}
                    label={{
                      value: "ppm",
                      angle: -90,
                      position: "insideLeft",
                      dy: -14,
                      style: {
                        fontWeight: 700,
                        fontSize: "20px",
                        fill: "#ffffff",
                      },
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#1e2a3a",
                      border: "2px solid #3498db",
                      borderRadius: "10px",
                      padding: "15px",
                      boxShadow: "0 5px 25px rgba(0, 0, 0, 0.5)",
                    }}
                    itemStyle={{
                      color: "#fff",
                      fontSize: "22px",
                      fontWeight: "700",
                      padding: "5px 0",
                    }}
                    formatter={(value, name) => [`${value} ppm`, name]}
                    labelStyle={{
                      color: "#fff",
                      fontWeight: "700",
                      fontSize: "18px",
                    }}
                    labelFormatter={(label) => {
                      if (!label) return "";

                      const timepart = label.split("T")[1];
                      if (!timepart) return label;

                      const time = timepart.split(".")[0];
                      //const hhmm = time.split(":").slice(0, 2).join(":");
                      return `Thời gian: ${time}`;
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: "30px",
                      fontWeight: "bold",
                      color: "#ffffff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={key}
                    name={name}
                    stroke={color}
                    strokeWidth={6}
                  />
                </LineChart>
                <input
                  type="range"
                  min="0"
                  max={Math.max(processedData.length - viewWindowSize, 0)}
                  value={scrollIndexForThisChart}
                  onChange={(e) =>
                    handleScrollChange(key, Number(e.target.value))
                  }
                  style={{
                    width: "100%",
                    marginTop: "20px",
                    accentColor: color,
                    height: "6px",
                    borderRadius: "4px",
                  }}
                />
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
