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

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  console.log("Returning cooke: "+match);
  return match ? decodeURIComponent(match[2]) : null;
}

function getUserIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('user_id');
}

async function fetchResults() {
  const userId = getUserIdFromUrl();
  let query = client.from('resultats').select('*');

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
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

// Responsive heatmap with legend and labels
const svg = d3.select('#heatmap')
  .attr('viewBox', '0 0 600 400')
  .attr('preserveAspectRatio', 'xMidYMid meet')
  .classed('responsive-svg', true);

xHeat = d3.scaleBand().domain(countries).range([100, 550]).padding(0.05);
yHeat = d3.scaleBand().domain(cats).range([50, 300]).padding(0.05);
colorScale = d3.scaleSequential(d3.interpolatePlasma).domain([0, 10]);

const heatData = matrix.flatMap((row, i) =>
  row.map((v, j) => ({ cat: cats[i], country: countries[j], value: v }))
);

// Draw heatmap cells
svg.selectAll('rect.heatcell')
  .data(heatData)
  .enter().append('rect')
    .attr('class', 'heatcell')
    .attr('x', d => xHeat(d.country))
    .attr('y', d => yHeat(d.cat))
    .attr('width', xHeat.bandwidth())
    .attr('height', yHeat.bandwidth())
    .style('fill', d => colorScale(d.value));

// X axis
svg.append('g')
  .attr('transform', `translate(0, ${yHeat.range()[1]})`)
  .call(d3.axisBottom(xHeat))
  .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end")
    .style("font-size", "10px");

// Y axis
svg.append('g')
  .attr('transform', `translate(${xHeat.range()[0]}, 0)`)
  .call(d3.axisLeft(yHeat))
  .selectAll("text")
    .style("font-size", "10px");

// Legend gradient
const defs = svg.append("defs");
const gradient = defs.append("linearGradient")
  .attr("id", "heatmap-gradient")
  .attr("x1", "0%").attr("x2", "100%")
  .attr("y1", "0%").attr("y2", "0%");

d3.range(0, 1.01, 0.01).forEach(t => {
  gradient.append("stop")
    .attr("offset", `${t * 100}%`)
    .attr("stop-color", colorScale(t * 10));
});

// Legend (moved down)
svg.append("rect")
  .attr("x", 100)
  .attr("y", 370) // ← was 320
  .attr("width", 300)
  .attr("height", 15)
  .style("fill", "url(#heatmap-gradient)");

svg.append("text")
  .attr("x", 100)
  .attr("y", 390) // ← was 340
  .style("font-size", "10px")
  .text("0");

svg.append("text")
  .attr("x", 400)
  .attr("y", 390)
  .attr("text-anchor", "end")
  .style("font-size", "10px")
  .text("10");

svg.append("text")
  .attr("x", 250)
  .attr("y", 410) // ← was 360
  .attr("text-anchor", "middle")
  .style("font-size", "12px")
  .text("Average Score");



  // Comments
// ————————————————
// 3) Comments Carousel (with Supabase)
// ————————————————
document.addEventListener('DOMContentLoaded', async () => {
  // 1) Load participants metadata for flags
  const participantsUrl =
    'https://raw.githubusercontent.com/eurovision-survey/surveyWeb/main/participants2024.json';
  let participants = [];
  try {
    const resp = await fetch(participantsUrl);
    participants = await resp.json();
  } catch (err) {
    console.error('Failed to load participants list:', err);
  }

  // 2) Fetch comments from Supabase
  let { data: comments, error: commentsError } = await client
    .from('comments')                // adjust to your comments table name
    .select('text, country');        // select only required fields
  if (commentsError) {
    console.error('Error fetching comments:', commentsError);
    return;
  }

  if (!comments || comments.length === 0) {
    console.warn('No comments to display.');
    return;
  }

  // Elements for carousel display
  const flagImg     = document.getElementById('carouselFlag');
  const countrySpan = document.getElementById('carouselCountry');
  const textP       = document.getElementById('carouselText');
  let lastIndex     = -1;

  function showRandomComment() {
    // pick a new random index, not the same as last time
    let idx;
    do {
      idx = Math.floor(Math.random() * comments.length);
    } while (idx === lastIndex && comments.length > 1);
    lastIndex = idx;

    const entry = comments[idx];
    // find countryCode in participants list
    const meta = participants.find(
      p => p['item-countryName'] === entry.country
    ) || {};
    const code = meta['item-countryCode'] || entry.country;
    const flagUrl =
      `https://raw.githubusercontent.com/eurovision-survey/surveyWeb/main/flags/${code}.svg`;

    // update DOM
    flagImg.src         = flagUrl;
    flagImg.alt         = `${entry.country} flag`;
    countrySpan.textContent = entry.country;
    textP.textContent   = `"${entry.text}"`;
  }

  // initial display and interval
  showRandomComment();
  setInterval(showRandomComment, 3000);
});

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

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('toggleResultsBtn');
  const currentParams = new URLSearchParams(window.location.search);
  const hasUserId = currentParams.has('user_id');
  const userId = getCookie("userId");

  if (hasUserId) {
    button.textContent = 'Go to global results';
    button.onclick = () => {
      window.open(`https://eurovision-survey.github.io/surveyWeb/results.html`, '_blank');
    };
  } else {
    button.textContent = 'Go to personal results';
    button.onclick = () => {
      window.open(`https://eurovision-survey.github.io/surveyWeb/results.html?user_id=${userId}`, '_blank');
    };
  }
});


init();