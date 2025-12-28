"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/Card";

interface DataPoint {
    name: string;
    notes: number;
}

interface NotesChartProps {
    data: DataPoint[];
}

export const NotesChart: React.FC<NotesChartProps> = ({ data }) => {
    // User requested range 0,5,10,15,20 all time
    const ticks = [0, 5, 10, 15, 20];
    const yAxisMax = 20;

    return (
        <Card className="h-[300px] w-full">
            <div className="flex flex-col h-full">
                <h3 className="font-bold text-lg mb-4 text-white shrink-0">Notes Overview</h3>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="rgba(255,255,255,0.3)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                interval={0}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.3)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                ticks={ticks}
                                domain={[0, yAxisMax]}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "rgba(10, 14, 39, 0.9)",
                                    borderColor: "rgba(255,255,255,0.1)",
                                    borderRadius: "8px",
                                    color: "#fff"
                                }}
                                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                            />
                            <Bar
                                dataKey="notes"
                                fill="#6B46C1"
                                radius={[4, 4, 0, 0]}
                                barSize={30}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Card>
    );
};
