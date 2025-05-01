// results.js

// ————————————————
// 1) Supabase client (global supabase from your <script src="…supabase-js@2">)
// ————————————————
const SUPABASE_URL     = 'https://ybwyoenjvlgqyldbvnkt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlid3lvZW5qdmxncXlsZGJ2bmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MDYxNTAsImV4cCI6MjA1NTM4MjE1MH0.cMh4puR6-7e60eunFZNrxrramGf2r28AxF-3buq2UDA';
const client   = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ————————————————
// 2) Global state & chart refs
// ————————————————
let rows = [];
let barRaceChart, timeSeriesChart;
let xHeat, yHeat, colorScale, yScalesParallel, lineGenParallel;

// ————————————————
// 3) Fetch & process data
// ————————————————
async function fetchResults() {
  const { data, error } = await client
    .from('resultats')
    .select('*');
  if (error) console.error(error);
  return data || [];
}

function processData(rows) {
  // overall averages per country
  const cats = ['originalitat','lletra','veus','ritme','vestuari','escenografia','interpretació','cultural','emocional','general'];
  const byCountry = d3.rollup(
    rows,
    v => {
      const obj = {};
      cats.forEach(k => obj[k] = d3.mean(v, d => d[k] || 0));
      return obj;
    },
    d => d.country
  );
  const overallList = Array.from(byCountry, ([country, vals]) => ({
    country,
    score: cats.reduce((sum,k) => sum + vals[k], 0) / cats.length
  })).sort((a,b) => b.score - a.score);

  // time series of “general” score
  const seriesByDate = d3.group(rows, r => r.date);
  const dates = Array.from(seriesByDate.keys()).sort((a,b)=>new Date(a)-new Date(b));
  const series = {
    labels: dates,
    datasets: [{
      label: 'Avg General',
      data: dates.map(d => d3.mean(seriesByDate.get(d), r => r.general)),
      fill: false,
      tension: 0.3
    }]
  };

  // heatmap matrix
  const countries = Array.from(byCountry.keys());
  const matrix = cats.map(cat =>
    countries.map(c => byCountry.get(c)[cat] || 0)
  );

  return { overallList, series, matrix, countries, cats };
}

// ————————————————
// 4) Initial render
// ————————————————
function initCharts({ overallList, series, matrix, countries, cats }) {
  // Bar race (top 5)
  const top5 = overallList.slice(0,5);
  const barCtx = document.getElementById('barRace').getContext('2d');
  barRaceChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: top5.map(o=>o.country),
      datasets: [{ label: 'Score', data: top5.map(o=>o.score) }]
    },
    options: {
      indexAxis: 'y',
      animation: { duration: 800 },
      scales: { x: { beginAtZero: true, max: 10 } }
    }
  });

  // Time series
  const tsCtx = document.getElementById('timeSeries').getContext('2d');
  timeSeriesChart = new Chart(tsCtx, {
    type: 'line',
    data: series,
    options: {
      animation: { duration: 800 },
      scales: { y: { beginAtZero: true, max: 10 } },
      elements: { point: { radius: 3 } }
    }
  });

  // Heatmap
  const svg = d3.select('#heatmap');
  xHeat = d3.scaleBand().domain(countries).range([50,450]).padding(0.05);
  yHeat = d3.scaleBand().domain(cats).range([50,260]).padding(0.05);
  colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0,10]);
  svg.selectAll('rect')
    .data(matrix.flatMap((row,i)=>row.map((v,j)=>({cat:cats[i],country:countries[j],value:v}))))
    .enter().append('rect')
      .attr('x', d=>xHeat(d.country))
      .attr('y', d=>yHeat(d.cat))
      .attr('width', xHeat.bandwidth())
      .attr('height', yHeat.bandwidth())
      .style('fill', d=>colorScale(d.value));

  // Parallel coords
  cats.forEach(cat => {
    yScalesParallel = yScalesParallel || {};
    yScalesParallel[cat] = d3.scaleLinear()
      .domain(d3.extent(rows, r=>r[cat]||0))
      .range([260,50]);
  });
  const xPar = d3.scalePoint().domain(cats).range([50,450]);
  lineGenParallel = d3.line()
    .x(p=>xPar(p.dim))
    .y(p=>yScalesParallel[p.dim](p.value));
  const g = svg
    .attr('width',800).attr('height',400)
    .select(function(){ return this.ownerDocument.querySelector('#parallelCoords'); })
    .append('g').attr('transform','translate(50,50)');
  g.selectAll('path')
    .data(rows)
    .enter().append('path')
      .attr('fill','none')
      .attr('stroke','steelblue')
      .attr('opacity',0.4)
      .attr('d', d=> lineGenParallel(cats.map(dim=>({dim,value:d[dim]||0}))));
}

function renderParticipantList(list) {
  const tbody = document.querySelector('#participantList tbody');
  tbody.innerHTML = '';
  list.forEach((o,i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${o.country}</td><td>${o.score.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
}

  // ————————————————
// 5) Realtime updates (Supabase JS v2 syntax)
// ————————————————
function setupRealtime() {
  // Create (or reuse) a channel listening to INSERTs on “resultats”
  client
    .channel('public:resultats') 
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'resultats' },
      ({ new: r }) => {
        rows.push(r);
        const { overallList, series, matrix, countries, cats } = processData(rows);

        // Bar race
        const top5 = overallList.slice(0,5);
        barRaceChart.data.labels = top5.map(o=>o.country);
        barRaceChart.data.datasets[0].data = top5.map(o=>o.score);
        barRaceChart.update({ duration:800 });

        // Time series
        timeSeriesChart.data.labels = series.labels;
        timeSeriesChart.data.datasets = series.datasets;
        timeSeriesChart.update({ duration:800 });

        // Heatmap
        const heatData = matrix.flatMap((row,i)=>row.map((v,j)=>({
          cat: cats[i], country: countries[j], value: v
        })));
        d3.select('#heatmap').selectAll('rect')
          .data(heatData)
          .transition().duration(800)
          .style('fill', d=>colorScale(d.value));

        // Parallel coords
        cats.forEach(cat =>
          yScalesParallel[cat].domain(d3.extent(rows, r=>r[cat]||0))
        );
        const g = d3.select('#parallelCoords g');
        const paths = g.selectAll('path').data(rows);
        paths.enter().append('path')
          .attr('fill','none').attr('stroke','steelblue').attr('opacity',0.4)
        .merge(paths)
          .transition().duration(800)
          .attr('d', d=>lineGenParallel(cats.map(dim=>({
            dim, value: d[dim]||0
          }))));
        paths.exit().remove();

        // Table
        renderParticipantList(overallList);
      }
    )
    .subscribe();
}

// ————————————————
// 6) Kick things off
// ————————————————
async function init() {
  rows = await fetchResults();
  const processed = processData(rows);
  initCharts(processed);
  renderParticipantList(processed.overallList);
  setupRealtime();
}

init();