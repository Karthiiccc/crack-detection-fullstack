import "./Sidebar.css";
import { FaCamera } from "react-icons/fa";
import { FaFileZipper } from "react-icons/fa6";
import { MdVideoCameraBack } from "react-icons/md";

const Sidebar = ({ isExpanded, onToggle, uploadType, onUploadTypeChange }) => {
  return (
    <div className={`sidebar ${isExpanded ? 'showNav' : ''}`}>
      <ul className="nav-list">
        <li className="nav-items">
          <div 
            className={`d-flex align-center ${uploadType === 'single' ? 'active-nav' : ''}`}
            onClick={() => onUploadTypeChange('single')}
            style={{cursor: 'pointer'}}
          >
            <div className="bar-img-wrap">
              <FaCamera style={{ fontSize: '20px' }} />
            </div>
            <span className="link_name">Single Image</span>
          </div>
          <span className="side-tooltip">Upload Single Image</span>
        </li>

        <li className="nav-items">
          <div 
            className={`d-flex align-center ${uploadType === 'zip' ? 'active-nav' : ''}`}
            onClick={() => onUploadTypeChange('zip')}
            style={{cursor: 'pointer'}}
          >
            <div className="bar-img-wrap">
              <FaFileZipper style={{ fontSize: '20px' }} />
            </div>
            <span className="link_name">ZIP File</span>
          </div>
          <span className="side-tooltip">Upload ZIP Archive</span>
        </li>

        <li className="nav-items">
          <div 
            className={`d-flex align-center ${uploadType === 'video' ? 'active-nav' : ''}`}
            onClick={() => onUploadTypeChange('video')}
            style={{cursor: 'pointer'}}
          >
            <div className="bar-img-wrap">
              <MdVideoCameraBack style={{ fontSize: '20px' }} />
            </div>
            <span className="link_name">Video</span>
          </div>
          <span className="side-tooltip">Upload Video File</span>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
