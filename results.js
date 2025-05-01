// Supabase initialization (rename instance to avoid shadow)


// results-realtime.js

import { createClient } from '@supabase/supabase-js'
import Chart from 'chart.js/auto'
import * as d3 from 'd3'

// ————————————————
// 1. Initialize Supabase client
// ————————————————
const SUPABASE_URL = 'https://ybwyoenjvlgqyldbvnkt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlid3lvZW5qdmxncXlsZGJ2bmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MDYxNTAsImV4cCI6MjA1NTM4MjE1MH0.cMh4puR6-7e60eunFZNrxrramGf2r28AxF-3buq2UDA';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ————————————————
// 2. Global state & chart refs
// ————————————————
let rows = []
let barRaceChart, timeSeriesChart
let xHeat, yHeat, colorScale, yScalesParallel, lineGenParallel

// ————————————————
// 3. Fetch & process data
// ————————————————
async function fetchResults() {
  const { data, error } = await client
    .from('resultats')
    .select('*')
  if (error) console.error(error)
  return data || []
}

function processData(rows) {
  // Example: compute country scores and time series
  const byCountry = d3.rollup(
    rows,
    v => d3.mean(v, d => d.score),
    d => d.country
  )
  const overallList = Array.from(byCountry, ([country, score]) => ({ country, score }))
    .sort((a, b) => d3.descending(a.score, b.score))

  const seriesByDate = d3.group(rows, d => d.date)
  const dateKeys = Array.from(seriesByDate.keys()).sort((a, b) => new Date(a) - new Date(b))
  const series = {
    labels: dateKeys,
    datasets: [{
      label: 'Average Score',
      data: dateKeys.map(date =>
        d3.mean(seriesByDate.get(date), d => d.score)
      ),
      fill: false,
      tension: 0.3
    }]
  }

  // Heatmap matrix
  const countries = Array.from(byCountry.keys())
  const cats = ['originalitat','lletra','veus','ritme','vestuari','escenografia','interpretació','cultural','emocional','general']
  const matrix = cats.map(cat =>
    countries.map(country => {
      const vals = rows.filter(r => r.country === country).map(r => r[cat])
      return vals.length ? d3.mean(vals) : 0
    })
  )

  return { overallList, series, matrix, countries, cats }
}

// ————————————————
// 4. Render and keep refs
// ————————————————
function initCharts({ overallList, series, matrix, countries, cats }) {
  // Bar race (top 5)
  const top5 = overallList.slice(0,5)
  const barCtx = document.getElementById('barRace').getContext('2d')
  barRaceChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: top5.map(o => o.country),
      datasets: [{ data: top5.map(o => o.score), label: 'Score' }]
    },
    options: {
      indexAxis: 'y',
      animation: { duration: 800 },
      scales: { x: { beginAtZero: true, max: 10 } }
    }
  })

  // Time series
  const tsCtx = document.getElementById('timeSeries').getContext('2d')
  timeSeriesChart = new Chart(tsCtx, {
    type: 'line',
    data: series,
    options: {
      animation: { duration: 800 },
      scales: { y: { beginAtZero: true, max: 10 } },
      elements: { point: { radius: 3 } }
    }
  })

  // Setup heatmap scales & SVG
  const heatSvg = d3.select('#heatmap')
    .attr('width', 500)
    .attr('height', 300)
  xHeat = d3.scaleBand().domain(countries).range([50, 450]).padding(0.05)
  yHeat = d3.scaleBand().domain(cats).range([50, 260]).padding(0.05)
  colorScale = d3.scaleSequential(d3.interpolateViridis)
    .domain([0, 10])

  heatSvg.append('g')
    .selectAll('rect')
    .data(matrix.flatMap((row, i) =>
      row.map((v,j) => ({ cat: cats[i], country: countries[j], value: v }))
    ))
    .enter().append('rect')
      .attr('x', d => xHeat(d.country))
      .attr('y', d => yHeat(d.cat))
      .attr('width', xHeat.bandwidth())
      .attr('height', yHeat.bandwidth())
      .style('fill', d => colorScale(d.value))

  // Parallel coords: init scales & line generator
  yScalesParallel = {}
  cats.forEach(cat => {
    yScalesParallel[cat] = d3.scaleLinear()
      .domain(d3.extent(rows, d => d[cat]))
      .range([260, 50])
  })
  const xPar = d3.scalePoint().domain(cats).range([50, 450])
  lineGenParallel = d3.line()
    .x(d => xPar(d.dim))
    .y(d => yScalesParallel[d.dim])
  d3.select('#parallelCoords')
    .attr('width', 500)
    .attr('height', 300)
    .append('g')
    .selectAll('path')
    .data(rows)
    .enter().append('path')
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('opacity', 0.4)
      .attr('d', d => lineGenParallel(cats.map(dim => ({ dim, value: d[dim] }))))
}

function renderParticipantList(overallList) {
  const tbody = document.querySelector('#participantList tbody')
  tbody.innerHTML = ''
  overallList.forEach(({ country, score }) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `<td>${country}</td><td>${score.toFixed(2)}</td>`
    tbody.appendChild(tr)
  })
}

// ————————————————
// 5. Realtime subscription & update logic
// ————————————————
function setupRealtime() {
  client
    .from('resultats')
    .on('INSERT', payload => {
      const newRow = payload.new
      rows.push(newRow)

      const { overallList, series, matrix, countries, cats } = processData(rows)

      // Update bar race
      const top5 = overallList.slice(0,5)
      barRaceChart.data.labels = top5.map(o => o.country)
      barRaceChart.data.datasets[0].data = top5.map(o => o.score)
      barRaceChart.update()

      // Update time series
      timeSeriesChart.data.labels = series.labels
      timeSeriesChart.data.datasets = series.datasets
      timeSeriesChart.update()

      // Update heatmap
      const heatSvg = d3.select('#heatmap')
      const dataHM = matrix.flatMap((row,i) =>
        row.map((v,j) => ({ cat: cats[i], country: countries[j], value: v }))
      )
      const cells = heatSvg.selectAll('rect').data(dataHM)
      cells.transition().duration(800)
        .style('fill', d => colorScale(d.value))

      // Update parallel coords
      cats.forEach(cat => {
        yScalesParallel[cat].domain(d3.extent(rows, d => d[cat]))
      })
      const paths = d3.select('#parallelCoords g').selectAll('path').data(rows)
      paths.enter().append('path')
        .attr('fill','none')
        .attr('stroke','steelblue')
        .attr('opacity',0.4)
      .merge(paths)
        .transition().duration(800)
        .attr('d', d => lineGenParallel(cats.map(dim => ({ dim, value: d[dim] }))))
      paths.exit().remove()

      // Update participant table
      renderParticipantList(overallList)
    })
    .subscribe()
}

// ————————————————
// 6. Initialize everything
// ————————————————
async function init() {
  rows = await fetchResults()
  const processed = processData(rows)
  initCharts(processed)
  renderParticipantList(processed.overallList)
  setupRealtime()
}

init()
