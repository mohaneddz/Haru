import { useNavigate } from '@solidjs/router';

export default function goBack() {
  const navigate = useNavigate();
	navigate(-1);
}
