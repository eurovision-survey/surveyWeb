// Supabase initialization (rename instance to avoid shadow)
const SUPABASE_URL = 'https://ybwyoenjvlgqyldbvnkt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlid3lvZW5qdmxncXlsZGJ2bmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MDYxNTAsImV4cCI6MjA1NTM4MjE1MH0.cMh4puR6-7e60eunFZNrxrramGf2r28AxF-3buq2UDA';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fetch all results
async function fetchResults() {
  const { data, error } = await client.from('resultats').select('*');
  if (error) throw error;
  return data;
}

// Compute per-country averages, time-series averages, and sorted list
function processData(rows) {
  const cats = ['originalitat','lletra','veus','ritme','vestuari','escenografia','interpretació','cultural','emocional','general'];
  const byCountry = {};
  const ts = {};
  const comments = [];

  rows.forEach(r => {
    const c = r.country;
    if (!byCountry[c]) {
      byCountry[c] = { count:0, sums:{} };
      cats.forEach(k=> byCountry[c].sums[k]=0);
    }
    byCountry[c].count++;
    cats.forEach(k=> byCountry[c].sums[k] += (r[k]||0));

    // time-series bucket
    const t = new Date(r.created_at).toISOString().slice(0,16);
    ts[t] = ts[t] || {};
    ts[t][c] = ts[t][c] || { sum:0, count:0 };
    ts[t][c].sum += r.general;
    ts[t][c].count++;

    if (r.comentari) comments.push(r.comentari);
  });

  // overall averages & sorted list
  const averages = {};
  Object.entries(byCountry).forEach(([c,v])=>{
    averages[c] = {};
    cats.forEach(k=> averages[c][k] = v.sums[k]/v.count);
  });
  const overallList = Object.entries(averages)
    .map(([c,vals])=>({ country:c, score: cats.reduce((s,k)=>s+vals[k],0)/cats.length }))
    .sort((a,b)=>b.score - a.score);

  // time-series averages
  const times = Object.keys(ts).sort();
  const series = { labels: times, datasets: [] };
  overallList.forEach(o=>{
    series.datasets.push({
      label: o.country,
      data: times.map(t => ts[t][o.country] ? ts[t][o.country].sum/ts[t][o.country].count : null)
    });
  });

  // prepare radar & bullet for top5
  const top5 = overallList.slice(0,5);
  const radarData = top5.map(o=>({ country:o.country, values: cats.map(k=> averages[o.country][k]) }));
  const bulletData = top5.map(o=>({
    country:o.country,
    song: (averages[o.country].ritme + averages[o.country].lletra + averages[o.country].originalitat + averages[o.country].emocional + averages[o.country].general)/5,
    interp:(averages[o.country].veus + averages[o.country].escenografia + averages[o.country].interpretació + averages[o.country].emocional + averages[o.country].general)/5
  }));

  // heatmap matrix
  const countries = overallList.map(o=>o.country);
  const matrix = cats.map(k => countries.map(c=> averages[c][k] ));

  // word cloud
  const freq = {};
  comments.join(' ').toLowerCase().split(/\W+/).forEach(w=>{ if(w.length>3) freq[w]=(freq[w]||0)+1; });
  const words = Object.entries(freq).map(([text,value])=>({ text,value }));

  return { cats, overallList, radarData, bulletData, matrix, countries, series, words };
}

// Render participant list
function renderParticipantList(list) {
  const tbody = document.querySelector('#participantList tbody');
  list.forEach((o,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${o.country}</td><td>${o.score.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
}

// Render functions
function renderBarRace(ctx, top5) {
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top5.map(o => o.country),
      datasets: [{ data: top5.map(o => o.score), label: 'Average Score' }]
    },
    options: {
      indexAxis: 'y',
      animation: { duration: 1500 },
      scales: { x: { beginAtZero: true, max: 10 } },
      plugins: { legend: { display: false } }
    }
  });
}

function renderRadar(containerId, radarData) {
  radarData.forEach(d => {
    const canvas = document.createElement('canvas');
    document.getElementById(containerId).appendChild(canvas);
    new Chart(canvas, {
      type: 'radar',
      data: {
        labels: d.values.map((_, i) => d.values[i].toFixed(1)),
        datasets: [{ label: d.country, data: d.values }]
      },
      options: { scales: { r: { beginAtZero: true, max: 10 } } }
    });
  });
}

function renderBullet(containerId, bulletData) {
  bulletData.forEach(d => {
    const canvas = document.createElement('canvas');
    document.getElementById(containerId).appendChild(canvas);
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Song', 'Interpreter'],
        datasets: [{ label: d.country, data: [d.song, d.interp] }]
      },
      options: {
        indexAxis: 'y',
        scales: { x: { beginAtZero: true, max: 10 } },
        plugins: { legend: { display: false } }
      }
    });
  });
}

function renderHeatmap(svgEl, matrix, countries, cats) {
  const svg = typeof svgEl === 'string' ? d3.select('#' + svgEl) : d3.select(svgEl);
  const width = +svg.attr('width'), height = +svg.attr('height');
  const x = d3.scaleBand().domain(countries).range([0, width]).padding(0.05);
  const y = d3.scaleBand().domain(cats).range([0, height]).padding(0.05);
  const color = d3.scaleSequential(d3.interpolateYlOrRd).domain([1, 10]);
  const data = matrix.flatMap((row, i) => row.map((v, j) => ({ cat: cats[i], country: countries[j], value: v })));
  svg.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
      .attr('x', d => x(d.country))
      .attr('y', d => y(d.cat))
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .style('fill', d => color(d.value));
  svg.append('g').call(d3.axisTop(x));
  svg.append('g').call(d3.axisLeft(y));
}

function renderParallel(rows, svgEl) {
  const svg = typeof svgEl === 'string' ? d3.select('#' + svgEl) : d3.select(svgEl);
  const margin = { top: 30, right: 10, bottom: 10, left: 10 };
  const width = +svg.attr('width') - margin.left - margin.right;
  const height = +svg.attr('height') - margin.top - margin.bottom;
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  const dims = ['originalitat','lletra','veus','ritme','vestuari','escenografia','interpretació','cultural','emocional','general'];
  const yScales = {};
  dims.forEach(d => {
    yScales[d] = d3.scaleLinear().domain(d3.extent(rows, r => r[d])).range([height, 0]);
  });
  const xScale = d3.scalePoint().domain(dims).range([0, width]);
  const lineGen = d3.line().x(p => xScale(p.dim)).y(p => yScales[p.dim](p.value));
  rows.forEach(row => {
    const rowData = dims.map(dim => ({ dim, value: row[dim] }));
    g.append('path')
      .datum(rowData)
      .attr('d', lineGen)
      .style('fill', 'none')
      .style('stroke', 'steelblue')
      .style('opacity', 0.3);
  });
  g.append('g').selectAll('text').data(dims).enter().append('text')
    .attr('x', d => xScale(d))
    .attr('y', -5)
    .text(d => d);
}

function renderTimeSeries(ctx, series) {
  new Chart(ctx, {
    type: 'line',
    data: series,
    options: { scales: { y: { beginAtZero: true, max: 10 } }, elements: { point: { radius: 2 } } }
  });
}

function renderWordCloud(words, elementId) {
  const layout = d3.layout.cloud().size([500,300]).words(words)
    .padding(5).rotate(() => ~~(Math.random()*2)*90).fontSize(d => Math.sqrt(d.value)*5)
    .on('end', draw);
  layout.start();
  function draw(words) {
    d3.select('#' + elementId).append('svg').attr('width', 500).attr('height', 300)
      .append('g').attr('transform', 'translate(250,150)')
      .selectAll('text').data(words).enter().append('text')
        .style('font-size', d => d.size + 'px')
        .attr('text-anchor', 'middle')
        .attr('transform', d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
        .text(d => d.text);
  }
}

// Main
(async()=>{
  try {
    const rows = await fetchResults();
    const { overallList, radarData, bulletData, matrix, countries, cats, series, words } = processData(rows);
    renderBarRace(document.getElementById('barRace').getContext('2d'), overallList.slice(0,5));
    renderParticipantList(overallList);
    renderRadar('radarContainer', radarData);
    renderBullet('bulletContainer', bulletData);
    renderHeatmap('heatmap', matrix, countries, cats);
    renderParallel(rows, 'parallelCoords');
    renderTimeSeries(document.getElementById('timeSeries').getContext('2d'), series);
    renderWordCloud(words, 'wordCloud');
  } catch(e) { console.error(e); }
})();