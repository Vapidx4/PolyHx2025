// eslint-disable-next-line import/no-anonymous-default-export
export default `
attribute float size;

varying vec3 fragPosition;

void main(){
  gl_PointSize=size;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
  fragPosition=(modelMatrix*vec4(position,1.)).xyz;
}
`;