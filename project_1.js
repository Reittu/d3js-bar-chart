// All values are retained unless some elements are explicitly positioned outside inner box (e.g. text via transform).
const MARGIN = { top: 80, right: 10, bottom: 80, left: 70 };
const OUTER_WIDTH = 1000,
  OUTER_HEIGHT = 500,
  INNER_WIDTH = OUTER_WIDTH - MARGIN.left - MARGIN.right,
  INNER_HEIGHT = OUTER_HEIGHT - MARGIN.top - MARGIN.bottom;

const TOOLTIP = { width: 160, offset: 30 };
TOOLTIP.offsetLeft = -(TOOLTIP.width + TOOLTIP.offset);
TOOLTIP.threshold = OUTER_WIDTH - TOOLTIP.width - TOOLTIP.offset;
const getTooltipOffset = e => (e.offsetX > TOOLTIP.threshold) ? TOOLTIP.offsetLeft : TOOLTIP.offset;

const xScale = d3.scaleTime().range([0, INNER_WIDTH]);
const yScale = d3.scaleLinear().range([INNER_HEIGHT, 0]);
const linearScale = d3.scaleLinear().range([0, INNER_HEIGHT]);

const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale)
  .tickSizeInner(-INNER_WIDTH)
  .tickSizeOuter(0);

const wrapper = d3.select('.d3-wrapper');

const tooltip = wrapper.append('div')
  .attr('id', 'tooltip')
  .attr('class', 'tooltip')
  .style('opacity', 0)
  .style('width', TOOLTIP.width + 'px');

const overlay = wrapper.append('div')
  .attr('class', 'overlay')
  .style('opacity', 0)
  .style('background-color', '#4a10d1');

const svg = wrapper.append('svg')
  .attr('width', OUTER_WIDTH)
  .attr('height', OUTER_HEIGHT)
  .append('g')
  .attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);

d3.json('https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/GDP-data.json')
  .then((data) => {
    barWidth = INNER_WIDTH / data.data.length;

    const years = data.data.map((item) => {
      const month = item[0].substring(5, 7);
      let quarter;
      quarter =
        (month === '01')
          ? 'Q1'
          : (month === '04')
            ? 'Q2'
            : (month === '07')
              ? 'Q3'
              : (month === '10')
                ? 'Q4'
                : null;

      // Year and quarter
      return item[0].substring(0, 4) + ' ' + quarter;
    });

    const yearsDate = data.data.map((item) => new Date(item[0]));
    const xMax = new Date(d3.max(yearsDate));
    xMax.setMonth(9); // For balancing the scale

    const GDP = data.data.map((item) => item[1]);
    const gdpMax = d3.max(GDP);

    xScale.domain([d3.min(yearsDate), xMax])
    yScale.domain([0, gdpMax]);
    linearScale.domain([0, gdpMax]);

    const scaledGDP = GDP.map((item) => linearScale(item));

    svg.append('g')
      .call(xAxis)
      .attr('id', 'x-axis')
      .attr('transform', `translate(0, ${INNER_HEIGHT})`);

    svg.append('g')
      .call(yAxis)
      .attr('id', 'y-axis');

    d3.select('g').selectAll('rect')
      .data(scaledGDP)
      .enter()
      .append('rect')
      .attr('data-date', (d, i) => data.data[i][0])
      .attr('data-gdp', (d, i) => data.data[i][1])
      .attr('class', 'bar')
      .attr('x', (d, i) => xScale(yearsDate[i]))
      .attr('y', (d, i) => INNER_HEIGHT - d)
      .attr('width', barWidth)
      .attr('height', (d) => d)
      .style('fill', '#6302d1')
      .on('mouseover', (d, i) => {
        overlay.transition()
          .duration(0)
          .style('height', d + 'px')
          .style('width', barWidth + 'px')
          .style('opacity', .9)
          .style('left', (i * barWidth) + MARGIN.left + 'px')
          .style('top', INNER_HEIGHT - d + MARGIN.top + 'px');
        tooltip.transition()
          .duration(0)
          .style('opacity', .9);
        tooltip.html(years[i] + '<br>' + '$' + GDP[i].toFixed(1).replace(/(\d)(?=(\d{3})+\.)/g, '$1,') + ' Billion')
          .attr('data-date', data.data[i][0])
          .style('left', (i * barWidth) + getTooltipOffset(d3.event) + 'px')
          .style('top', INNER_HEIGHT - 100 + MARGIN.top + 'px')
          .style('transform', 'translateX(60px)');
      })
      .on('mouseout', (d) => {
        tooltip.transition()
          .duration(0)
          .style('opacity', 0);
        overlay.transition()
          .duration(0)
          .style('opacity', 0);
      });

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .attr('x', -INNER_HEIGHT / 2)
      .attr('y', 30)
      .text('Gross Domestic Product');

    svg.append('text')
      .attr('x', INNER_WIDTH)
      .attr('y', INNER_HEIGHT + MARGIN.bottom - 20)
      .attr('text-anchor', 'end')
      .text('More Information: http://www.bea.gov/national/pdf/nipaguid.pdf')
      .attr('class', 'info');

  }).catch(err => console.log(err));