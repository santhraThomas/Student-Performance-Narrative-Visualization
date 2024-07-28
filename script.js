let currentSlide = 0;
const slides = [showTopStudents, showGenderPassRatio, showEthnicityGroups, showTestPreparationStatus];

function updateSlide() {
  // Clear the previous content
  d3.select('#visualization-container').selectAll('*').remove();
  
  // Show the current slide
  slides[currentSlide]();

  // Update button states
  document.getElementById('prev-slide').disabled = (currentSlide === 0);
  document.getElementById('next-slide').disabled = (currentSlide === slides.length - 1);
}

function showTopStudents() {
  d3.csv('StudentsPerformance.csv').then(data => {
    data.forEach(d => {
      d.avg_score = (+d['math score'] + +d['reading score'] + +d['writing score']) / 3;
    });

    data.sort((a, b) => b.avg_score - a.avg_score);

    let topN = 10;

    // Check if the input field exists
    const input = d3.select('#visualization-container').selectAll('input');
    if (input.empty()) {
      d3.select('#visualization-container').append('input')
        .attr('type', 'number')
        .attr('id', 'topNInput')
        .attr('value', 10)
        .on('change', function() {
          topN = +this.value;
          updateChart();
        });
    }

    function updateChart() {
      let topStudents = data.slice(0, topN);

      d3.select('#visualization-container').selectAll('svg').remove();

      const svg = d3.select('#visualization-container').append('svg')
        .attr('width', 800)
        .attr('height', 400);

      const x = d3.scaleBand()
        .domain(d3.range(topN))
        .range([0, 800])
        .padding(0.1);

      const y = d3.scaleLinear()
        .domain([0, d3.max(topStudents, d => d.avg_score)])
        .nice()
        .range([400, 0]);

      const color = d3.scaleOrdinal(d3.schemeCategory10);

      svg.append('text')
        .attr('x', 400)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text('Top Students by Average Score');

      svg.append('g')
        .attr('transform', 'translate(0,400)')
        .call(d3.axisBottom(x).tickFormat(i => i + 1))
        .append('text')
        .attr('x', 400)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .text('Rank');

      svg.append('g')
        .call(d3.axisLeft(y))
        .append('text')
        .attr('x', -40)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .text('Average Score');

      svg.selectAll('.bar')
        .data(topStudents)
        .enter().append('rect')
        .attr('fill', (d, i) => color(i))
        .attr('class', 'bar')
        .attr('x', (d, i) => x(i))
        .attr('y', d => y(d.avg_score))
        .attr('width', x.bandwidth())
        .attr('height', d => 400 - y(d.avg_score))
        .on('mouseover', function(event, d) {
          const tooltip = d3.select('#visualization-container').append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background', '#f4f4f4')
            .style('padding', '5px')
            .style('border', '1px solid #ccc')
            .style('border-radius', '5px')
            .html(`Gender: ${d.gender}<br>Ethnicity: ${d['race/ethnicity']}<br>Math: ${d['math score']}<br>Reading: ${d['reading score']}<br>Writing: ${d['writing score']}`)
            .style('left', (event.pageX + 5) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
          d3.select('.tooltip').remove();
        });

      // Initially update the chart
      updateChart();
    }
  });
}

function showGenderPassRatio() {
  d3.csv('StudentsPerformance.csv').then(data => {
    data.forEach(d => {
      d.pass = (+d['math score'] >= 60 && +d['reading score'] >= 60 && +d['writing score'] >= 60) ? 'pass' : 'fail';
    });

    const passCounts = d3.rollups(data, v => v.filter(d => d.pass === 'pass').length, d => d.gender);

    const pieData = passCounts.map(([gender, count]) => ({
      gender,
      count
    }));

    const width = 400, height = 400, radius = Math.min(width, height) / 2;

    const color = d3.scaleOrdinal()
      .domain(['female', 'male'])
      .range(d3.schemeCategory10);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    const pie = d3.pie()
      .value(d => d.count);

    const svg = d3.select('#visualization-container').append('svg')
      .attr('width', width)
      .attr('height', height);

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Gender Pass Ratio');

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const arcs = g.selectAll('.arc')
      .data(pie(pieData))
      .enter().append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.gender));

    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('dy', '0.35em')
      .text(d => `${d.data.gender}: ${d.data.count}`);
  });
}

function showEthnicityGroups() {
  d3.csv('StudentsPerformance.csv').then(data => {
    const groupCounts = d3.rollups(data, v => v.length, d => d['race/ethnicity']);

    const barData = groupCounts.map(([ethnicity, count]) => ({
      ethnicity,
      count
    }));

    const svg = d3.select('#visualization-container').append('svg')
      .attr('width', 800)
      .attr('height', 400);

    const x = d3.scaleBand()
      .domain(barData.map(d => d.ethnicity))
      .range([0, 800])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(barData, d => d.count)])
      .nice()
      .range([400, 0]);

    svg.append('text')
      .attr('x', 400)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Student Distribution by Ethnicity');

    svg.append('g')
      .attr('transform', 'translate(0,400)')
      .call(d3.axisBottom(x))
      .append('text')
      .attr('x', 400)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .text('Ethnicity');

    svg.append('g')
      .call(d3.axisLeft(y))
      .append('text')
      .attr('x', -40)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .text('Number of Students');

    svg.selectAll('.bar')
      .data(barData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.ethnicity))
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => 400 - y(d.count))
      .attr('fill', (d, i) => d3.schemeCategory10[i % 10]);
  });
}


function showTestPreparationStatus() {
  d3.csv('StudentsPerformance.csv').then(data => {
    // Count the number of students in each test preparation status
    const prepCounts = d3.rollups(data, v => v.length, d => d['test preparation course']);

    // Prepare the data for the line chart
    const lineData = prepCounts.map(([status, count]) => ({
      status,
      count
    }));

    // Create the SVG container
    const svg = d3.select('#visualization-container').append('svg')
      .attr('width', 800)
      .attr('height', 400);

    // Define scales
    const x = d3.scalePoint()
      .domain(lineData.map(d => d.status))
      .range([0, 800])
      .padding(0.5);

    const y = d3.scaleLinear()
      .domain([0, d3.max(lineData, d => d.count)])
      .nice()
      .range([400, 0]);

    // Add x-axis with label
    svg.append('g')
      .attr('transform', 'translate(0,400)')
      .call(d3.axisBottom(x))
      .append('text')
      .attr('x', 400)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .text('Test Preparation Course Status');

    // Add y-axis with label
    svg.append('g')
      .call(d3.axisLeft(y))
      .append('text')
      .attr('x', -40)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .text('Number of Students');

    // Define the line generator
    const line = d3.line()
      .x(d => x(d.status))
      .y(d => y(d.count));

    // Add the line path to the SVG
    svg.append('path')
      .datum(lineData)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Optional: Add circles at data points
    svg.selectAll('circle')
      .data(lineData)
      .enter().append('circle')
      .attr('cx', d => x(d.status))
      .attr('cy', d => y(d.count))
      .attr('r', 5)
      .attr('fill', 'steelblue');
  });
}


document.getElementById('prev-slide').addEventListener('click', () => {
  currentSlide = (currentSlide > 0) ? currentSlide - 1 : slides.length - 1;
  updateSlide();
});

document.getElementById('next-slide').addEventListener('click', () => {
  currentSlide = (currentSlide < slides.length - 1) ? currentSlide + 1 : 0;
  updateSlide();
});

// Load the first slide on page load
updateSlide();
