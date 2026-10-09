import PropTypes from 'prop-types';

export default function HelloWorld({ name = 'World' }) {
  return <h1>Hello, {name}!</h1>;
}

HelloWorld.propTypes = {
  name: PropTypes.string,
};
