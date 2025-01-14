import React, { useState, useLayoutEffect, useEffect } from 'react';
import '../Styles/Editor.style.css';
import { element } from '../utils/helper_functions';
import { guest } from '../components/Guest-manager';
import rough from 'roughjs/bundled/rough.esm.js';
import ColorSelector from '../components/Color-selector';
import TextForm from '../components/Text-form';
import GuestManager from '../components/Guest-manager';
import Draggable from 'react-draggable';
import { getTemplate, postTemplate } from '../services/server-client';
import { template } from '../services/server-client';
import {
  writeDetails,
  createElement,
  getElementAtPosition,
  localElementsJson,
} from '../utils/helper_functions';

type EditorProps = {
  userId: string;
  userMail: string;
  userName: string;
};
type SelectedElement = {
  id?: string;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  type?: string;
  color?: string;
  roughElement?: any;
};
type PointerOffSet = {
  offsetX?: number;
  offsetY?: number;
};

const Editor: React.FC<EditorProps> = ({ userId, userMail, userName }) => {
  const [elements, setElements] = useState<element[]>(localElementsJson);
  const [partyDetails, setPartyDetails] = useState({
    // host: '',
    // stickers: [],
    name: '',
    age: 0,
    date: new Date(Date.now()),
    time: '',
    address: '',
    // email: '',
  });
  const [guestList, setGuestList] = useState<guest[]>([]);
  const [action, setAction] = useState('none');
  const [tool, setTool] = useState('');
  const [selectedElement, setSelectedElement] = useState<SelectedElement>({});
  const [pointerOffset, setPointerOffset] = useState<PointerOffSet>({});
  const [selectedColor, setSelectedColor] = useState('none');
  const [colorMenuHidden, setColorMenuHidden] = useState(true);
  const [textMenuHidden, setTextMenuHidden] = useState(true);
  const [guestMenuHidden, setGuestMenuHidden] = useState(true);

  useEffect(() => {
    console.log(partyDetails, 'aprtydetails');
    const getMyTemplate = async () => {
      const myTemplate = await getTemplate(userId);
      console.log(userId, 'userId');
      console.log(myTemplate, 'my Template');
      if (myTemplate) {
        console.log('inside the if');
        const myElements = myTemplate.stickers;
        const myDetails = {
          name: myTemplate.name,
          age: myTemplate.age,
          date: myTemplate.date,
          time: myTemplate.time,
          address: myTemplate.address,
        };
        setElements([...myElements]);
        setPartyDetails(myDetails);
      } else {
        localStorage.clear();
        setElements([]);
        setPartyDetails({
          // host: '',
          // stickers: [],
          name: '',
          age: 0,
          date: new Date(Date.now()),
          time: '',
          address: '',
          // email: '',
        });
      }
    };

    getMyTemplate();
  }, [userId]);

  useLayoutEffect(() => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const context = canvas.getContext(
      '2d'
    ) as unknown as CanvasRenderingContext2D;

    context.clearRect(0, 0, canvas.width, canvas.height);

    const roughCanvas = rough.canvas(canvas);
    elements.forEach((element: element) =>
      roughCanvas.draw(element.roughElement)
    );

    if (elements) {
      localStorage.setItem('elements', JSON.stringify(elements));
    }

    writeDetails(partyDetails, canvas, context);
    if (partyDetails) {
      localStorage.setItem('partyDetails', JSON.stringify(partyDetails));
    }
  }, [elements, partyDetails]);

  const updateElement = (
    id: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    type: string,
    color: string
  ) => {
    const updatedElement: element = createElement(
      id,
      x1,
      y1,
      x2,
      y2,
      type,
      color
    );
    const elementsCopy = [...elements];
    elementsCopy[id as unknown as number] = updatedElement;
    setElements([...elementsCopy]);
  };
  function handleChange(toolName: string) {
    toolName !== 'paint' ? setColorMenuHidden(true) : setColorMenuHidden(false);
    toolName !== 'text' ? setTextMenuHidden(true) : setTextMenuHidden(false);
    toolName !== 'guest' ? setGuestMenuHidden(true) : setGuestMenuHidden(false);
    setTool(toolName);
  }
  function handleMouseDown(event: React.MouseEvent<Element, MouseEvent>) {
    const { clientX, clientY } = event;
    if (tool === 'move') {
      const defaultColor = 'none';
      setSelectedColor(defaultColor);
      const element = getElementAtPosition(clientX, clientY, elements);
      if (element) {
        const offsetX = clientX - element.x1;
        const offsetY = clientY - element.y1;
        setSelectedElement({ ...element });
        setPointerOffset({ offsetX, offsetY });
        setAction('moving');
      }
    } else if (tool === 'paint') {
      const element = getElementAtPosition(clientX, clientY, elements);
      if (element) {
        const defaultColor = 'black';
        if (selectedColor === 'none') setSelectedColor(defaultColor);
        const { id, x1, y1, x2, y2, type } = element;
        const paintedElement = createElement(
          id,
          x1,
          y1,
          x2,
          y2,
          type,
          selectedColor
        );
        const elementsCopy = [...elements];
        elementsCopy[id as unknown as number] = paintedElement;
        setElements([...elementsCopy]);
      }
    } else if (tool === 'eraser') {
      const defaultColor = 'none';
      setSelectedColor(defaultColor);
      const element = getElementAtPosition(clientX, clientY, elements);
      if (element) {
        //To_DO check if id exists to erase
        const { id } = element;
        const elementsCopy = [
          ...elements.slice(0, id as unknown as number),
          ...elements.slice((id as unknown as number) + 1),
        ];
        setElements([...elementsCopy]);
      }
    } else if (tool === 'text') {
      return;
    } else if (tool === 'guest') {
      return;
    } else {
      const defaultColor = 'none';
      setSelectedColor(defaultColor);
      const id = elements.length;
      const element = createElement(
        id as unknown as string,
        clientX,
        clientY,
        clientX,
        clientY,
        tool,
        selectedColor
      );
      setElements((prevState) => [...prevState, element]);
      setAction('drawing');
    }
  }
  function handleMouseMove(event: React.MouseEvent<Element, MouseEvent>) {
    const { clientX, clientY } = event;
    const target = event.target as typeof event.target & {
      style: { cursor: string };
    };
    if (tool === 'move') {
      target.style.cursor = getElementAtPosition(clientX, clientY, elements)
        ? 'move'
        : 'default';
    }

    if (action === 'drawing') {
      const index: number = elements.length - 1;
      const { x1, y1 } = elements[index];
      updateElement(
        index as unknown as string,
        x1,
        y1,
        clientX,
        clientY,
        tool,
        selectedColor
      );
    } else if (action === 'moving') {
      const { id, x1, x2, y1, y2, type, color } = selectedElement;
      const { offsetX, offsetY } = pointerOffset;
      if (id && x1 && x2 && y1 && y2 && type && color && offsetX && offsetY) {
        const width = x2 - x1;
        const height = y2 - y1;
        const newX = clientX - offsetX;
        const newY = clientY - offsetY;
        updateElement(
          id as unknown as string,
          newX,
          newY,
          newX + width,
          newY + height,
          type!,
          color!
        );
      }
    }
  }
  function handleMouseUp() {
    setAction('none');
    setSelectedElement({});
  }
  async function saveCanvas() {
    const template: template = {
      host: userId,
      stickers: elements,
      name: partyDetails.name,
      age: partyDetails.age,
      date: partyDetails.date,
      time: partyDetails.time,
      address: partyDetails.address,
      email: userMail,
    };
    postTemplate(userId, template);
  }

  return (
    <div className="Editor">
      <>
        {/* {console.log(colorMenuHidden)} */}
        <div>
          {!guestMenuHidden && (
            <Draggable>
              <div className="text-menu-container">
                <GuestManager
                  guestList={guestList}
                  setGuestList={setGuestList}
                  userMail={userMail}
                />
              </div>
            </Draggable>
          )}
          {!textMenuHidden && (
            <Draggable>
              <div className="text-menu-container">
                <TextForm setPartyDetails={setPartyDetails} />
              </div>
            </Draggable>
          )}
          <Draggable>
            <div className="tool-menu-container">
              <div className="tool-menu">
                <div>
                  <input
                    className="check-input"
                    type="checkbox"
                    id="line"
                    checked={tool === 'line'}
                    onChange={() => handleChange('line')}
                  />
                  <label htmlFor="line">Line</label>
                </div>
                <div>
                  <input
                    className="check-input"
                    type="checkbox"
                    id="triangle"
                    checked={tool === 'triangle'}
                    onChange={() => handleChange('triangle')}
                  />
                  <label htmlFor="triangle">Triangle</label>
                </div>
                <div>
                  <input
                    className="check-input"
                    type="checkbox"
                    id="rectangle"
                    checked={tool === 'rectangle'}
                    onChange={() => handleChange('rectangle')}
                  />
                  <label htmlFor="rectangle">Rectangle</label>
                </div>
                <div>
                  <input
                    className="check-input"
                    type="checkbox"
                    id="circle"
                    checked={tool === 'circle'}
                    onChange={() => handleChange('circle')}
                  />
                  <label htmlFor="circle">Circle</label>
                </div>

                <div>
                  <input
                    className="check-input"
                    type="checkbox"
                    id="paint"
                    checked={tool === 'paint'}
                    onChange={() => handleChange('paint')}
                  />
                  <label htmlFor="paint">Paint</label>{' '}
                </div>
                <div>
                  <input
                    className="check-input"
                    type="checkbox"
                    id="move"
                    checked={tool === 'move'}
                    onChange={() => handleChange('move')}
                  />
                  <label htmlFor="move">Move</label>
                </div>
                <div>
                  <input
                    className="check-input"
                    type="checkbox"
                    id="eraser"
                    checked={tool === 'eraser'}
                    onChange={() => handleChange('eraser')}
                  />
                  <label htmlFor="eraser">Eraser</label>
                </div>
                <div>
                  <input
                    className="check-input"
                    type="checkbox"
                    id="text"
                    checked={tool === 'text'}
                    onChange={() => handleChange('text')}
                  />
                  <label htmlFor="text">Text</label>
                </div>
                <div>
                  <input
                    className="check-input"
                    type="checkbox"
                    id="guest"
                    checked={tool === 'guest'}
                    onChange={() => handleChange('guest')}
                  />
                  <label htmlFor="guest">Guest-List</label>
                </div>
              </div>
            </div>
          </Draggable>
          {!colorMenuHidden && (
            <Draggable>
              <div className="color-menu">
                <ColorSelector
                  setSelectedColor={setSelectedColor}
                ></ColorSelector>
              </div>
            </Draggable>
          )}
        </div>
        <canvas
          id="canvas"
          width={window.innerWidth}
          height={window.innerHeight}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        ></canvas>
        <button id="save-button" onClick={() => saveCanvas()}>
          Save Invitation
        </button>
      </>
    </div>
  );
};
export default Editor;
