"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Sample data - in a real app, this would come from an API
const generateNetworkData = () => {
  const nodes = []
  const links = []

  // Generate 100 student nodes
  for (let i = 0; i < 100; i++) {
    nodes.push({
      id: `student-${i}`,
      name: `Student ${i}`,
      group: Math.floor(i / 25), // Assign to one of 4 groups
      academicScore: 50 + Math.random() * 50,
      wellbeingScore: 50 + Math.random() * 50,
    })
  }

  // Generate friendship links (more dense within groups)
  for (let i = 0; i < nodes.length; i++) {
    const groupId = nodes[i].group

    // Create in-group connections (higher probability)
    for (let j = 0; j < nodes.length; j++) {
      if (i !== j && nodes[j].group === groupId && Math.random() > 0.7) {
        links.push({
          source: nodes[i].id,
          target: nodes[j].id,
          type: "friendship",
          strength: 0.5 + Math.random() * 0.5,
        })
      }
    }

    // Create some out-group connections (lower probability)
    for (let j = 0; j < nodes.length; j++) {
      if (i !== j && nodes[j].group !== groupId && Math.random() > 0.95) {
        links.push({
          source: nodes[i].id,
          target: nodes[j].id,
          type: "friendship",
          strength: 0.1 + Math.random() * 0.4,
        })
      }
    }

    // Create some negative interactions
    if (Math.random() > 0.9) {
      const targetIndex = Math.floor(Math.random() * nodes.length)
      if (i !== targetIndex) {
        links.push({
          source: nodes[i].id,
          target: nodes[targetIndex].id,
          type: "negative",
          strength: 0.1 + Math.random() * 0.3,
        })
      }
    }
  }

  return { nodes, links }
}

const networkData = generateNetworkData()

interface D3NetworkProps {
  data: {
    nodes: any[]
    links: any[]
  }
  width: number
  height: number
  networkType: string
}

function D3Network({ data, width, height, networkType }: D3NetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove()

    // Filter links based on network type
    const filteredLinks = networkType === "all" ? data.links : data.links.filter((link) => link.type === networkType)

    // Create a filtered dataset
    const filteredData = {
      nodes: data.nodes,
      links: filteredLinks,
    }

    // Set up the simulation
    const simulation = d3
      .forceSimulation(filteredData.nodes)
      .force(
        "link",
        d3
          .forceLink(filteredData.links)
          .id((d: any) => d.id)
          .distance((link) => (networkType === "negative" ? 100 : 50)),
      )
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(20))

    // Create the SVG container
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;")

    // Create a group for the visualization
    const g = svg.append("g")

    // Add zoom functionality
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
      })

    svg.call(zoom as any)

    // Create tooltip
    const tooltip = d3
      .select(tooltipRef.current)
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("border", "1px solid #ddd")
      .style("border-radius", "4px")
      .style("padding", "8px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "10")

    // Create the links
    const link = g
      .append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(filteredData.links)
      .join("line")
      .attr("stroke", (d: any) => (d.type === "friendship" ? "#52c41a" : "#ff4d4f"))
      .attr("stroke-width", (d: any) => d.strength * 3)

    // Create the nodes
    const node = g
      .append("g")
      .selectAll("circle")
      .data(filteredData.nodes)
      .join("circle")
      .attr("r", 8)
      .attr("fill", (d: any) => ["#ff4d4f", "#52c41a", "#1890ff", "#722ed1"][d.group])
      .call(drag(simulation) as any)
      .on("mouseover", (event, d: any) => {
        tooltip
          .style("visibility", "visible")
          .html(`
            <strong>${d.name}</strong><br/>
            Academic: ${Math.round(d.academicScore)}<br/>
            Wellbeing: ${Math.round(d.wellbeingScore)}
          `)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px")
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden")
      })

    // Add labels to nodes
    const labels = g
      .append("g")
      .selectAll("text")
      .data(filteredData.nodes)
      .join("text")
      .text((d: any) => d.name)
      .attr("font-size", "8px")
      .attr("dx", 10)
      .attr("dy", 4)
      .style("pointer-events", "none")

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y)

      labels.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y)
    })

    // Drag functionality
    function drag(simulation: any) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        event.subject.fx = event.subject.x
        event.subject.fy = event.subject.y
      }

      function dragged(event: any) {
        event.subject.fx = event.x
        event.subject.fy = event.y
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0)
        event.subject.fx = null
        event.subject.fy = null
      }

      return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended)
    }

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [data, width, height, networkType])

  return (
    <div className="relative">
      <svg ref={svgRef} />
      <div ref={tooltipRef} />
    </div>
  )
}

export function NetworkVisualization() {
  const [networkType, setNetworkType] = useState("all")
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 })

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect()
      setDimensions({ width, height })
    }

    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="h-full">
      <Tabs defaultValue="all" className="mb-4" onValueChange={setNetworkType}>
        <TabsList>
          <TabsTrigger value="all">All Connections</TabsTrigger>
          <TabsTrigger value="friendship">Friendship Network</TabsTrigger>
          <TabsTrigger value="negative">Negative Interactions</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="h-[450px]">
          <div ref={containerRef} className="h-full">
            <D3Network data={networkData} width={dimensions.width} height={dimensions.height} networkType="all" />
          </div>
        </TabsContent>

        <TabsContent value="friendship" className="h-[450px]">
          <div ref={containerRef} className="h-full">
            <D3Network
              data={networkData}
              width={dimensions.width}
              height={dimensions.height}
              networkType="friendship"
            />
          </div>
        </TabsContent>

        <TabsContent value="negative" className="h-[450px]">
          <div ref={containerRef} className="h-full">
            <D3Network data={networkData} width={dimensions.width} height={dimensions.height} networkType="negative" />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex space-x-2 mt-4">
        <Button variant="outline" size="sm">
          Export Network Data
        </Button>
        <Button variant="outline" size="sm">
          Apply Network Insights
        </Button>
      </div>
    </div>
  )
}